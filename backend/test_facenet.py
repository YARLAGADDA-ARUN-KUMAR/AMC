import torch
from facenet_pytorch import InceptionResnetV1

print("Loading model...")
model = InceptionResnetV1(pretrained='vggface2').eval()
print("Model loaded successfully!")
