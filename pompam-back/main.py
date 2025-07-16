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

with open("trucks.json", "r", encoding="utf-8") as f:
    trucks = json.load(f)

with open("products.json", "r", encoding="utf-8") as f:
    products = json.load(f)
promotion = [item for item in products if item["promotion"]]

with open("orders.json", "r", encoding="utf-8") as f:
    orders = json.load(f)

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

@app.get("/merchant-map", response_class=HTMLResponse)
def merchant_map(request: Request):
    return temp.TemplateResponse("merchant_map.html", {"request": request})

@app.get("/merchant-profile", response_class=HTMLResponse)
def merchant_profile(request: Request):
    return temp.TemplateResponse("truck-profile.html", {"request": request})

@app.get("/merchant-credit", response_class=HTMLResponse)
def merchant_credit(request: Request):
    return temp.TemplateResponse("credit-topup.html", {"request": request})

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
        "active_filter": filter_category,
        "trucks": trucks
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

@app.get("/profile", response_class=HTMLResponse)
def profile(request: Request):
    return temp.TemplateResponse("user-profile.html", {"request": request})

@app.get("/pre-order", response_class=HTMLResponse)
def merchant_profile(request: Request):
    selected = [products[0]['name'], products[3]['name'], products[4]['name']]
    print(selected)
    return temp.TemplateResponse("user-preorder.html", {
        "request": request,
        "products": products,
        "selected": selected
    })

@app.get("/preorder-products", response_class=HTMLResponse)
def get_inventory_products(request: Request, filter: str = "เนื้อสัตว์"):
    if filter == "ทั้งหมด":
        filtered = products
    else:
        filtered = [item for item in products if item["category"] == filter]
    return temp.TemplateResponse("user-preorder-category.html", {
        "request": request,
        "products": filtered
    })

@app.get("/pre-order/confirm", response_class=HTMLResponse)
def merchant_profile(request: Request):
    return temp.TemplateResponse("confirm-preorder.html", {"request": request})

@app.get("/pre-order/see-order", response_class=HTMLResponse)
def merchant_profile(request: Request):
    return temp.TemplateResponse("see-order.html", {"request": request})

@app.get("/merchant-inventory", response_class=HTMLResponse)
def merchant_profile(request: Request):
    return temp.TemplateResponse("inventory.html", {
        "request": request,
        "products": products
    })

@app.get("/inventory-products", response_class=HTMLResponse)
def get_inventory_products(request: Request, filter: str = "เนื้อสัตว์"):
    if filter == "ทั้งหมด":
        filtered = products
    else:
        filtered = [item for item in products if item["category"] == filter]
    return temp.TemplateResponse("inventory-category.html", {
        "request": request,
        "products": filtered
    })

@app.get("/recommend-products", response_class=HTMLResponse)
def get_inventory_products(request: Request, filter: str = "เนื้อสัตว์"):
    if filter == "ทั้งหมด":
        filtered = products
    else:
        filtered = [item for item in products if item["category"] == filter]
    return temp.TemplateResponse("recommend-category.html", {
        "request": request,
        "products": filtered
    })

@app.get("/merchant-preorder", response_class=HTMLResponse)
def merchant_profile(request: Request):
    return temp.TemplateResponse("pre-order.html", {
        "request": request,
        "orders": orders
    })

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)