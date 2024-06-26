from pydantic import BaseModel
from typing import Optional

class User(BaseModel):
    id: int
    username: str
    avatar: str
    created: str


class Post(BaseModel):
    id: int
    title: str
    content: str
    image: str
    userId: int
    created: str


class Comment(BaseModel):
    id: int
    content: str
    userId: int
    postId: int
    created: str


class CreateUserRequest(BaseModel):
    username: Optional[str] = None
    password: str
    avatar: str
    


class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    user: User


class CreatePostRequest(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    image: str
    userId: int


class CreateCommentRequest(BaseModel):
    postId: int
    content: Optional[str] = None
    userId: int


class Error(BaseModel):
    error_message: str
