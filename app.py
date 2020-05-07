from flask import Flask
from flask import render_template
from pymongo import MongoClient
import json
from bson import json_util
from bson.json_util import dumps
from newsapi import NewsApiClient

# Init
newsapi = NewsApiClient(api_key='92f7976f22e94e109f47ef929d205515')

app = Flask(__name__)

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/news/<state>")
def getnews(state):
    print(f"state to query: {state}")
    # top_headlines = newsapi.get_top_headlines(q=str(state),
                                              # language='en',
                                              # country='us')
    headlines = newsapi.get_everything(q=state)
    return headlines

if __name__ == "__main__":
    app.run(host='0.0.0.0',port=5000,debug=True)
