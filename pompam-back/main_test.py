from fastapi import FastAPI, Request, Form
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles

import database_sqlite as db
import uvicorn

app = FastAPI()

temp = Jinja2Templates(directory="public")
app.mount("/static", StaticFiles(directory="static"), name="static")


@app.get("/", response_class=HTMLResponse)
def home(request: Request):
    # data = db.get_all_data()
    bestseller = [
        {"name": "กล้วยหอมทอง", "desc": "หวาน นุ่ม", "price": 25, "img": "/static/images/banana.jpg"},
        {"name": "บรอกโคลี", "desc": "สด กรอบ", "price": 30, "img": "/static/images/broccoli.jpg"},
        {"name": "บรอกโคลี", "desc": "สด กรอบ", "price": 30, "img": "/static/images/broccoli.jpg"},
        {"name": "แครอท", "desc": "หวาน กรอบ", "price": 15, "img": "/static/images/carrot.jpg"},
        {"name": "มะเขือเทศ", "desc": "สดใหม่", " price": 10, "img": "/static/images/tomato.jpg"},
        {"name": "ผักกาดขาว", "desc": "กรอบ สด", "price": 20, "img": "/static/images/cabbage.jpg"}
    ]
    promotion = [
        {"name": "ผักกาดขาว", "desc": "สดใหม่จากสวน", "price": 20, "img": "/static/images/cabbage.jpg"},
    ]
    return temp.TemplateResponse("user-main.html", {
        "request": request,
        "bestseller": bestseller,
        "promotion": promotion,
    })
@app.post("/add")
def add_user(name: str = Form(...), email: str = Form(...)):
    db.add_user(name, email)
    return RedirectResponse(url="/", status_code=303)
@app.get("/users", response_class=HTMLResponse)
def get_users(request: Request):
    users = db.get_all_users()
    return temp.TemplateResponse("users.html", {"request": request, "users": users})
@app.get("/user/{user_id}", response_class=HTMLResponse)
def get_user(request: Request, user_id: int):
    user = db.get_user_by_id(user_id)
    if user:
        return temp.TemplateResponse("user_detail.html", {"request": request, "user": user})
    else:
        return HTMLResponse(content="User not found", status_code=404)
@app.get("/delete/{user_id}")
def delete_user(user_id: int):  
    db.delete_user(user_id)
    return RedirectResponse(url="/users", status_code=303)
@app.get("/edit/{user_id}", response_class=HTMLResponse)
def edit_user(request: Request, user_id: int):
    user = db.get_user_by_id(user_id)
    if user:
        return temp.TemplateResponse("edit_user.html", {"request": request, "user": user})
    else:
        return HTMLResponse(content="User not found", status_code=404)

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)

