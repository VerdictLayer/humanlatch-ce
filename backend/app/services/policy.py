import fnmatch
from typing import Optional

from sqlalchemy.orm import Session

from app.models.policy import PolicyRule
from app.services.risk import calculate_risk_score


def evaluate_policy(
    db: Session,
    workspace_id: str,
    action_type: str,
    target: str,
    context: dict,
) -> tuple[int, Optional[str], str]:
    """
    Returns (risk_score, policy_outcome, final_status).
    final_status is one of: approved_auto, pending_approval, blocked
    """
    risk_score = calculate_risk_score(action_type, target, context)

    rules = (
        db.query(PolicyRule)
        .filter(PolicyRule.workspace_id == workspace_id, PolicyRule.is_active == True)
        .order_by(PolicyRule.priority.desc())
        .all()
    )

    matched_outcome: Optional[str] = None
    environment = context.get("environment", "")

    for rule in rules:
        if not fnmatch.fnmatch(action_type, rule.action_type_pattern):
            continue
        if rule.environment_pattern and not fnmatch.fnmatch(environment, rule.environment_pattern):
            continue
        if rule.target_pattern and not fnmatch.fnmatch(target, rule.target_pattern):
            continue
        matched_outcome = rule.outcome
        break

    final_status = _resolve_status(risk_score, matched_outcome)
    return risk_score, matched_outcome, final_status


def _resolve_status(risk_score: int, policy_outcome: Optional[str]) -> str:
    if policy_outcome == "block":
        return "blocked"

    if policy_outcome == "allow":
        if risk_score < 30:
            return "approved_auto"
        elif risk_score >= 70:
            return "blocked"
        else:
            return "pending_approval"

    # require_approval or no match
    return "pending_approval"
