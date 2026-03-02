import jwt
import requests
from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import os
from dotenv import load_dotenv

load_dotenv()

AUTH0_AUDIENCE = os.getenv("AUTH0_AUDIENCE")
AUTH0_ISSUER_BASE_URL = os.getenv("AUTH0_ISSUER_BASE_URL")

class VerifyToken:
    """Does all the token verification steps"""

    def __init__(self):
        jwks_url = f"{AUTH0_ISSUER_BASE_URL}/.well-known/jwks.json"
        self.jwks_client = jwt.PyJWKClient(jwks_url)

    async def verify(self, auth: HTTPAuthorizationCredentials = Depends(HTTPBearer())):
        try:
            signing_key = self.jwks_client.get_signing_key_from_jwt(auth.credentials)
            print("auth.credentials", auth.credentials)
            payload = jwt.decode(
                auth.credentials,
                signing_key.key,
                algorithms=["RS256"],
                audience=AUTH0_AUDIENCE,
                issuer=f"{AUTH0_ISSUER_BASE_URL}/",
            )
            return payload
        except jwt.exceptions.PyJWTError as e:
            raise HTTPException(status_code=401, detail=str(e))
        except Exception as e:
            raise HTTPException(status_code=401, detail="Invalid token")

auth_verifier = VerifyToken()
