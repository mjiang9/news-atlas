from apscheduler.schedulers.blocking import BlockingScheduler 
from newsapi import NewsApiClient
import os
import psycopg2

states = {'01': 'Alabama', '02': 'Alaska', '04': 'Arizona', '05': 'Arkansas', '06': 'California', '08': 'Colorado', '09': 'Connecticut', '10': 'Delaware', '11': 'District of Columbia', '12': 'Florida', '13': 'Georgia', '15': 'Hawaii', '16': 'Idaho', '17': 'Illinois', '18': 'Indiana', '19': 'Iowa', '20': 'Kansas', '21': 'Kentucky', '22': 'Louisiana', '23': 'Maine', '24': 'Maryland', '25': 'Massachusetts', '26': 
'Michigan', '27': 'Minnesota', '28': 'Mississippi', '29': 'Missouri', '30': 'Montana', '31': 'Nebraska', '32': 'Nevada', '33': 'New Hampshire', '34': 'New Jersey', '35': 'New Mexico', '36': 'New York', '37': 'North Carolina', '38': 'North Dakota', '39': 'Ohio', '40': 'Oklahoma', '41': 'Oregon', '42': 'Pennsylvania', '44': 'Rhode Island', '45': 'South Carolina', '46': 'South Dakota', '47': 'Tennessee', 
'48': 'Texas', '49': 'Utah', '50': 'Vermont', '51': 'Virginia', '53': 'Washington', '54': 'West Virginia', '55': 'Wisconsin', '56': 'Wyoming', '72': 'Puerto Rico'}

sched = BlockingScheduler()
newsapi = NewsApiClient(api_key='92f7976f22e94e109f47ef929d205515')
DATABASE_URL = os.environ['DATABASE_URL']

@sched.scheduled_job('interval', hours = 24)
def update():
    conn = psycopg2.connect(DATABASE_URL, sslmode='require')
    print(conn.encoding)
    cursor = conn.cursor()
    cursor.execute("SET client_encoding to 'UTF8'")
    
    query = """ INSERT INTO news (state, source, title, description, date) VALUES (%s,%s,%s,%s,%s) ON CONFLICT DO NOTHING """

    print("Updating database...")
    for id in states:
        state = states[id]
        headlines = newsapi.get_everything(q=state)
        for article in headlines['articles']:
            record = (state, article['source']['name'], article['title'], article['description'], article['publishedAt'])
            cursor.execute(query, record)
            conn.commit()
        
    count = cursor.rowcount
    print(count, "Database updated!")
    cursor.close()
    conn.close()

sched.start()