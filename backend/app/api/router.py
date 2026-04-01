from fastapi import APIRouter

from app.api import auth, workspaces, api_keys, actions, policies, audit

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(workspaces.router)
api_router.include_router(api_keys.router)
api_router.include_router(actions.router)
api_router.include_router(policies.router)
api_router.include_router(audit.router)
