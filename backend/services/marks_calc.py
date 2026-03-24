from models.marks import Marks
from models.user import User


def get_marks_stats(subject_id):
    marks = Marks.query.filter_by(subject_id=subject_id).all()
    scored = [m for m in marks if m.total is not None]

    if not scored:
        return {
            "subject_id": subject_id,
            "class_average": 0,
            "topper": None,
            "topper_score": 0,
            "lowest_score": 0,
            "fail_count": 0,
            "total_students": 0,
            "distribution": {"75 – 90": 0, "50 – 74": 0, "Below 50": 0},
        }

    totals = [m.total for m in scored]
    topper = max(scored, key=lambda m: m.total)

    return {
        "subject_id": subject_id,
        "class_average": round(sum(totals) / len(totals), 2),
        "topper": topper.student.name if topper.student else "—",
        "topper_score": topper.total,
        "lowest_score": min(totals),
        "fail_count": sum(1 for t in totals if t < 50),
        "total_students": len(scored),
        "distribution": {
            "75 – 90": sum(1 for t in totals if t >= 75),
            "50 – 74": sum(1 for t in totals if 50 <= t < 75),
            "Below 50": sum(1 for t in totals if t < 50),
        },
    }