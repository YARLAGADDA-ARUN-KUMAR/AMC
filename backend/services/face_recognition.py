"""
Face Recognition Service
Uses OpenCV for face detection and PyTorch ResNet18 for real face embeddings.
Supports both real recognition (for registered faces) and simulation (for unregistered).
"""

import base64
import json
import random
import numpy as np
import cv2

import torch
import torchvision.transforms as transforms
from facenet_pytorch import InceptionResnetV1


class FaceRecognitionService:
    """Handles face detection (OpenCV) and recognition (facenet-pytorch embeddings)."""

    SIMILARITY_THRESHOLD = 0.70  # Lowered for true face embeddings (usually >0.7 for same person)

    def __init__(self):
        # Load OpenCV Haar cascade for face detection
        cascade_path = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
        self.face_cascade = cv2.CascadeClassifier(cascade_path)

        # PyTorch model for face embeddings — pretrained InceptionResnetV1 on VGGFace2
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model = InceptionResnetV1(pretrained='vggface2').eval().to(self.device)

        # facenet_pytorch expects 160x160 and inputs scaled to [-1, 1]
        self.transform = transforms.Compose([
            transforms.ToPILImage(),
            transforms.Resize((160, 160)),
            transforms.ToTensor(), # maps to [0, 1]
            transforms.Normalize(mean=[0.5, 0.5, 0.5], std=[0.5, 0.5, 0.5]), # maps to [-1, 1]
        ])

        # Track already-recognized students per session
        self._session_recognized = {}

    def decode_base64_image(self, base64_str):
        """Decode a base64 image string to an OpenCV numpy array."""
        if "," in base64_str:
            base64_str = base64_str.split(",", 1)[1]
        img_bytes = base64.b64decode(base64_str)
        np_arr = np.frombuffer(img_bytes, np.uint8)
        frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        return frame

    def detect_faces(self, frame):
        """Detect faces using Haar cascade. Returns list of (x, y, w, h)."""
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces = self.face_cascade.detectMultiScale(
            gray, scaleFactor=1.1, minNeighbors=5, minSize=(60, 60)
        )
        return faces if len(faces) > 0 else []

    def get_face_embedding(self, frame, bbox):
        """Extract a 512-dim face embedding using pretrained ResNet18."""
        x, y, w, h = bbox
        face_crop = frame[y : y + h, x : x + w]
        if face_crop.size == 0:
            return None
        face_rgb = cv2.cvtColor(face_crop, cv2.COLOR_BGR2RGB)
        tensor = self.transform(face_rgb).unsqueeze(0).to(self.device)
        with torch.no_grad():
            embedding = self.model(tensor)
        emb = embedding.cpu().numpy().flatten()
        # L2-normalize for cosine similarity
        norm = np.linalg.norm(emb)
        if norm > 0:
            emb = emb / norm
        return emb

    def cosine_similarity(self, emb1, emb2):
        """Compute cosine similarity between two normalized embeddings."""
        return float(np.dot(emb1, emb2))

    def register_face(self, base64_images):
        """
        Register a face from multiple webcam photos.
        Returns the average embedding as a JSON-serializable list.
        """
        embeddings = []
        for img_b64 in base64_images:
            frame = self.decode_base64_image(img_b64)
            if frame is None:
                continue
            faces = self.detect_faces(frame)
            if len(faces) == 0:
                continue
            # Use the largest face
            largest = max(faces, key=lambda f: f[2] * f[3])
            emb = self.get_face_embedding(frame, tuple(largest))
            if emb is not None:
                embeddings.append(emb)

        if len(embeddings) == 0:
            return None

        # Average all embeddings and re-normalize
        avg_emb = np.mean(embeddings, axis=0)
        norm = np.linalg.norm(avg_emb)
        if norm > 0:
            avg_emb = avg_emb / norm
        return avg_emb.tolist()

    def recognize_from_frame(self, base64_image, students, session_id, registered_encodings=None):
        """
        Process a webcam frame and recognize students.

        If registered_encodings is provided (dict of student_id -> embedding list),
        uses real embedding comparison. Falls back to simulation for unregistered students.
        """
        frame = self.decode_base64_image(base64_image)
        if frame is None:
            return {"face_count": 0, "recognized": [], "frame": None}

        faces = self.detect_faces(frame)
        face_count = len(faces) if len(faces) > 0 else 0

        session_key = str(session_id)
        if session_key not in self._session_recognized:
            self._session_recognized[session_key] = set()

        recognized = []
        registered_encodings = registered_encodings or {}
        matched_face_indices = set()

        if face_count > 0 and students:
            all_registered_students = {
                s["id"]: s for s in students
                if str(s["id"]) in registered_encodings
            }

            face_labels = [None] * len(faces)

            if all_registered_students:
                for i, (fx, fy, fw, fh) in enumerate(faces):
                    if i in matched_face_indices:
                        continue
                    live_emb = self.get_face_embedding(frame, (fx, fy, fw, fh))
                    if live_emb is None:
                        continue

                    best_match = None
                    best_similarity = self.SIMILARITY_THRESHOLD

                    for sid, student in all_registered_students.items():
                        stored_emb = np.array(registered_encodings[str(sid)])
                        similarity = self.cosine_similarity(live_emb, stored_emb)
                        if similarity > best_similarity:
                            best_similarity = similarity
                            best_match = student

                    if best_match:
                        student_id = best_match["id"]
                        
                        if student_id not in self._session_recognized[session_key]:
                            recognized.append({
                                "student_id": best_match["id"],
                                "name": best_match["name"],
                                "roll_number": best_match["roll_number"],
                                "confidence": round(best_similarity, 2),
                            })
                            self._session_recognized[session_key].add(student_id)
                        
                        face_labels[i] = {
                            "name": best_match["name"],
                            "confidence": best_similarity
                        }
                        matched_face_indices.add(i)

            # Draw bounding boxes
            for i, (x, y, w, h) in enumerate(faces):
                info = face_labels[i]
                if info:
                    color = (0, 255, 0)
                    label = f"{info['name']} ({info['confidence']:.0%})"
                else:
                    color = (0, 165, 255)
                    label = "Unknown"
                    
                cv2.rectangle(frame, (x, y), (x + w, y + h), color, 2)
                cv2.putText(
                    frame, label, (x, y - 10),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2
                )

        _, buffer = cv2.imencode(".jpg", frame)
        annotated_b64 = base64.b64encode(buffer).decode("utf-8")

        return {
            "face_count": face_count,
            "recognized": recognized,
            "frame": f"data:image/jpeg;base64,{annotated_b64}",
        }

    def get_session_recognized(self, session_id):
        session_key = str(session_id)
        return list(self._session_recognized.get(session_key, set()))

    def clear_session(self, session_id):
        session_key = str(session_id)
        self._session_recognized.pop(session_key, None)


# Singleton instance
face_service = FaceRecognitionService()
