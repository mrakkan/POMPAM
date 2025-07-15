from fastapi.responses import HTMLResponse

from fastapi import FastAPI, Request, Form
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles

import database_sqlite as db
import uvicorn
import json

app = FastAPI()

temp = Jinja2Templates(directory="public")
app.mount("/static", StaticFiles(directory="static"), name="static")

with open("products.json", "r", encoding="utf-8") as f:
    products = json.load(f)
promotion = [item for item in products if item["promotion"]]

@app.get("/", response_class=HTMLResponse)
def tunnel_home(request: Request):
    return temp.TemplateResponse("main.html" , {
        "request": request})

@app.get("/merchant-main", response_class=HTMLResponse)
def home(request: Request):
    filter_category = request.query_params.get("filter", "สินค้าแนะนำ")
    if filter_category == "สินค้าแนะนำ":
        filtered = products[:6]
    else:
        filtered = [item for item in products if item["category"] == filter_category]
    return temp.TemplateResponse("merchant-main.html", {
        "request": request,
        "bestseller": filtered,
        "promotion": promotion,
        "active_filter": filter_category
    })

@app.get("/map_merchant", response_class=HTMLResponse)
def merchant_map(request: Request):
    return temp.TemplateResponse("merchant_map.html", {"request": request})
    
@app.get("/user-main", response_class=HTMLResponse)
def home(request: Request):
    filter_category = request.query_params.get("filter", "สินค้าแนะนำ")
    if filter_category == "สินค้าแนะนำ":
        filtered = products[:6]
    else:
        filtered = [item for item in products if item["category"] == filter_category]
    return temp.TemplateResponse("user-main.html", {
        "request": request,
        "bestseller": filtered,
        "promotion": promotion,
        "active_filter": filter_category
    })

@app.get("/map", response_class=HTMLResponse)
def mapp(request: Request):
    return temp.TemplateResponse("map-page.html", {"request": request})

@app.get("/products", response_class=HTMLResponse)
def get_products(request: Request, filter: str = "สินค้าแนะนำ"):
    if filter == "สินค้าแนะนำ":
        filtered = products[:6]
    else:
        filtered = []
        for item in products:
            if item["category"] == filter:
                filtered.append(item)
    return temp.TemplateResponse("product-category.html", {
        "request": request,
        "bestseller": filtered
    })

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)