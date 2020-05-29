from flask import Flask
from flask import render_template
from pymongo import MongoClient
import json
from bson import json_util
from bson.json_util import dumps
from newsapi import NewsApiClient
from flask_sqlalchemy import SQLAlchemy
import os
import datetime as dt

# Init
newsapi = NewsApiClient(api_key='92f7976f22e94e109f47ef929d205515')

app = Flask(__name__)

app.config.from_object(os.environ['APP_SETTINGS'])
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# from models import News

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/news/<state>")
def getnews(state):
    print(f"state to query: {state}")
    if state == "Washington":
    	state = "Washington NOT DC NOT D.C."
    weekago = dt.datetime.now() - dt.timedelta(days=7)

    headlines = newsapi.get_everything(q=state + " AND (coronavirus OR covid)", 
    								   page_size=100, language='en',
                                       from_param=weekago.strftime("%Y-%m-%d"), sort_by="relevancy")
    return headlines

if __name__ == "__main__":
    app.run(host='0.0.0.0',port=5000,debug=True)
