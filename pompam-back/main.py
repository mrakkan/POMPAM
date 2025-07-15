from fastapi.responses import HTMLResponse

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
def tunnel_home(request: Request):
    return temp.TemplateResponse("main.html" , {
        "request": request})


@app.get("/merchant-main", response_class=HTMLResponse)
def merchant_home(request: Request):
    products = [
        {"name": "กล้วยหอมทอง", "desc": "หวาน นุ่ม", "price": 25, "img": "/static/images/banana.jpg", "rating": 5, "category": "ผักผลไม้"},
        {"name": "บรอกโคลี", "desc": "สด กรอบ", "price": 30, "img": "/static/images/broccoli.jpg", "rating": 4, "category": "ผักผลไม้"},
        {"name": "แครอท", "desc": "หวาน กรอบ", "price": 15, "img": "/static/images/carrot.jpg", "rating": 3, "category": "ผักผลไม้"},
        {"name": "มะเขือเทศ", "desc": "สดใหม่", "price": 10, "img": "/static/images/tomato.jpg", "rating": 2, "category": "ผักผลไม้"},
        {"name": "ผักกาดขาว", "desc": "กรอบ สด", "price": 20, "img": "/static/images/cabbage.jpg", "rating": 4, "category": "ผักผลไม้"},
        {"name": "หมูสามชั้น", "desc": "มันน้อย สดใหม่", "price": 120, "img": "/static/images/pork.jpg", "rating": 5, "category": "เนื้อสัตว์"},
        {"name": "อกไก่", "desc": "โปรตีนสูง", "price": 80, "img": "/static/images/chicken.jpg", "rating": 4, "category": "เนื้อสัตว์"},
        {"name": "พริกไทยดำ", "desc": "เผ็ดร้อน หอม", "price": 40, "img": "/static/images/pepper.jpg", "rating": 4, "category": "เครื่องเทศ"},
        {"name": "ขิง", "desc": "สดใหม่จากสวน", "price": 25, "img": "/static/images/ginger.jpg", "rating": 3, "category": "เครื่องเทศ"},
        {"name": "ลิ้นจี่", "desc": "หวานฉ่ำ", "price": 60, "img": "/static/images/lychee.jpg", "rating": 5, "category": "สินค้าตามฤดูกาล"},
        {"name": "ทุเรียน", "desc": "เนื้อแน่น หอม", "price": 200, "img": "/static/images/durian.jpg", "rating": 5, "category": "สินค้าตามฤดูกาล"}
    ]
    promotion = [
        {"name": "ผักกาดขาว", "desc": "สดใหม่จากสวน", "price": 20, "img": "/static/images/cabbage.jpg", "rating": 4, "category": "ผักผลไม้"},
    ]
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
    # Product data with categories
    products = [
        {"name": "กล้วยหอมทอง", "desc": "หวาน นุ่ม", "price": 25, "img": "/static/images/banana.jpg", "rating": 5, "category": "ผักผลไม้"},
        {"name": "บรอกโคลี", "desc": "สด กรอบ", "price": 30, "img": "/static/images/broccoli.jpg", "rating": 4, "category": "ผักผลไม้"},
        {"name": "แครอท", "desc": "หวาน กรอบ", "price": 15, "img": "/static/images/carrot.jpg", "rating": 3, "category": "ผักผลไม้"},
        {"name": "มะเขือเทศ", "desc": "สดใหม่", "price": 10, "img": "/static/images/tomato.jpg", "rating": 2, "category": "ผักผลไม้"},
        {"name": "ผักกาดขาว", "desc": "กรอบ สด", "price": 20, "img": "/static/images/cabbage.jpg", "rating": 4, "category": "ผักผลไม้"},
        {"name": "หมูสามชั้น", "desc": "มันน้อย สดใหม่", "price": 120, "img": "/static/images/pork.jpg", "rating": 5, "category": "เนื้อสัตว์"},
        {"name": "อกไก่", "desc": "โปรตีนสูง", "price": 80, "img": "/static/images/chicken.jpg", "rating": 4, "category": "เนื้อสัตว์"},
        {"name": "พริกไทยดำ", "desc": "เผ็ดร้อน หอม", "price": 40, "img": "/static/images/pepper.jpg", "rating": 4, "category": "เครื่องเทศ"},
        {"name": "ขิง", "desc": "สดใหม่จากสวน", "price": 25, "img": "/static/images/ginger.jpg", "rating": 3, "category": "เครื่องเทศ"},
        {"name": "ลิ้นจี่", "desc": "หวานฉ่ำ", "price": 60, "img": "/static/images/lychee.jpg", "rating": 5, "category": "สินค้าตามฤดูกาล"},
        {"name": "ทุเรียน", "desc": "เนื้อแน่น หอม", "price": 200, "img": "/static/images/durian.jpg", "rating": 5, "category": "สินค้าตามฤดูกาล"}
    ]
    promotion = [
        {"name": "ผักกาดขาว", "desc": "สดใหม่จากสวน", "price": 20, "img": "/static/images/cabbage.jpg", "rating": 4, "category": "ผักผลไม้"},
    ]
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
    products = [
        {"name": "กล้วยหอมทอง", "desc": "หวาน นุ่ม", "price": 25, "img": "/static/images/banana.jpg", "rating": 5, "category": "ผักผลไม้"},
        {"name": "บรอกโคลี", "desc": "สด กรอบ", "price": 30, "img": "/static/images/broccoli.jpg", "rating": 4, "category": "ผักผลไม้"},
        {"name": "แครอท", "desc": "หวาน กรอบ", "price": 15, "img": "/static/images/carrot.jpg", "rating": 3, "category": "ผักผลไม้"},
        {"name": "มะเขือเทศ", "desc": "สดใหม่", "price": 10, "img": "/static/images/tomato.jpg", "rating": 2, "category": "ผักผลไม้"},
        {"name": "ผักกาดขาว", "desc": "กรอบ สด", "price": 20, "img": "/static/images/cabbage.jpg", "rating": 4, "category": "ผักผลไม้"},
        {"name": "หมูสามชั้น", "desc": "มันน้อย สดใหม่", "price": 120, "img": "/static/images/pork.jpg", "rating": 5, "category": "เนื้อสัตว์"},
        {"name": "อกไก่", "desc": "โปรตีนสูง", "price": 80, "img": "/static/images/chicken.jpg", "rating": 4, "category": "เนื้อสัตว์"},
        {"name": "พริกไทยดำ", "desc": "เผ็ดร้อน หอม", "price": 40, "img": "/static/images/pepper.jpg", "rating": 4, "category": "เครื่องเทศ"},
        {"name": "ขิง", "desc": "สดใหม่จากสวน", "price": 25, "img": "/static/images/ginger.jpg", "rating": 3, "category": "เครื่องเทศ"},
        {"name": "ลิ้นจี่", "desc": "หวานฉ่ำ", "price": 60, "img": "/static/images/lychee.jpg", "rating": 5, "category": "สินค้าตามฤดูกาล"},
        {"name": "ทุเรียน", "desc": "เนื้อแน่น หอม", "price": 200, "img": "/static/images/durian.jpg", "rating": 5, "category": "สินค้าตามฤดูกาล"}
    ]
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