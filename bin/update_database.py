from apscheduler.schedulers.blocking import BlockingScheduler 
from newsapi import NewsApiClient
import os
import psycopg2
import json
import datetime as dt

sched = BlockingScheduler()
newsapi = NewsApiClient(api_key="c89e608c4ae345e5a03cc1db04983b3a")
#newsapi = NewsApiClient(api_key='92f7976f22e94e109f47ef929d205515')
DATABASE_URL = os.environ['DATABASE_URL']

# not in use
def update():
    conn = psycopg2.connect(DATABASE_URL, sslmode='require')
    cursor = conn.cursor()
    
    query = """ INSERT INTO news (state, county, result) VALUES (%s,%s,%s) """

    print("Updating database...")
    for id in states:
        state = states[id]
        if (state == 'Washington'):
            state = "Washington NOT DC NOT D.C."
        weekago = dt.datetime.now() - dt.timedelta(days=7)
        headlines = newsapi.get_everything(q=state + " AND (coronavirus OR covid)", 
                                        page_size=100, language='en',
                                        from_param=weekago.strftime("%Y-%m-%d"), sort_by="relevancy")
        record = (states[id], '', json.dumps(headlines))
        cursor.execute(query, record)
        conn.commit()
        
    count = cursor.rowcount
    print(count, "Database updated!")
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

clear()