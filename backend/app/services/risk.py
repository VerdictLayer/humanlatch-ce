def calculate_risk_score(action_type: str, target: str, context: dict) -> int:
    score = 0

    environment = context.get("environment", "").lower()
    if environment == "production":
        score += 30

    action_lower = action_type.lower()
    risky_keywords = ["iam", "secret", "security_group", "dns", "route53"]
    if any(kw in action_lower for kw in risky_keywords):
        score += 30

    destructive_keywords = ["delete", "destroy", "detach", "revoke", "remove", "drop", "terminate"]
    if any(kw in action_lower for kw in destructive_keywords):
        score += 40

    target_lower = target.lower()
    sensitive_targets = ["admin", "root", "prod", "production"]
    if any(kw in target_lower for kw in sensitive_targets):
        score += 20

    return min(score, 100)
