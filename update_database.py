from apscheduler.schedulers.blocking import BlockingScheduler 
from newsapi import NewsApiClient
import os
import sys
import psycopg2
import json
import datetime as dt
from filter_news import filter_news

newsapi = NewsApiClient(api_key="c89e608c4ae345e5a03cc1db04983b3a")
#newsapi = NewsApiClient(api_key='92f7976f22e94e109f47ef929d205515')
DATABASE_URL = os.environ['DATABASE_URL']

states = {'01': 'Alabama', '02': 'Alaska', '04': 'Arizona', '05': 'Arkansas', '06': 'California', '08': 'Colorado', '09': 'Connecticut', '10': 'Delaware', '11': 'District of Columbia', '12': 'Florida', '13': 'Georgia', '15': 'Hawaii', '16': 'Idaho', '17': 'Illinois', '18': 'Indiana', '19': 'Iowa', '20': 'Kansas', '21': 'Kentucky', '22': 'Louisiana', '23': 'Maine', '24': 'Maryland', '25': 'Massachusetts', '26': 
'Michigan', '27': 'Minnesota', '28': 'Mississippi', '29': 'Missouri', '30': 'Montana', '31': 'Nebraska', '32': 'Nevada', '33': 'New Hampshire', '34': 'New Jersey', '35': 'New Mexico', '36': 'New York', '37': 'North Carolina', '38': 'North Dakota', '39': 'Ohio', '40': 'Oklahoma', '41': 'Oregon', '42': 'Pennsylvania', '44': 'Rhode Island', '45': 'South Carolina', '46': 'South Dakota', '47': 'Tennessee', 
'48': 'Texas', '49': 'Utah', '50': 'Vermont', '51': 'Virginia', '53': 'Washington', '54': 'West Virginia', '55': 'Wisconsin', '56': 'Wyoming', '72': 'Puerto Rico'}


def get_state_news():
    for i in states:
        get_news(states[i])
    
def get_news(state):
    print(f"state to query: {state}")  
    conn = psycopg2.connect(DATABASE_URL, sslmode='require')
    cursor = conn.cursor()

    # print(result)
    if (state == 'Washington'):
        query_state = "Washington NOT DC NOT D.C."
    else:
        query_state = state
    weekago = dt.datetime.now() - dt.timedelta(days=7)
    headlines = newsapi.get_everything(q=query_state + ' AND (coronavirus OR covid)', 
                                    page_size=100, language='en',
                                    from_param=weekago.strftime("%Y-%m-%d"), sort_by="relevancy")
    filtered_news = filter_news(headlines, state, '')
    query = """ INSERT INTO news (state, county, result, keywords) VALUES (%s,%s,%s,%s) """
    record = (state, '', json.dumps(headlines), filtered_news['keywords'])
    cursor.execute(query, record)
    conn.commit()

    cursor.close()
    conn.close()

def clear():
    conn = psycopg2.connect(DATABASE_URL, sslmode='require')
    cursor = conn.cursor()
    query = "DELETE FROM news"
    cursor.execute(query)
    conn.commit()
    cursor.close()
    conn.close()
    print("News deleted!")

clear()
get_state_news()