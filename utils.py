import json
import requests
from bs4 import BeautifulSoup
def getCovidHelp(state):
    """Get donation links from google, limited requests -> should store into db"""
    key = 0
    cx = '004593184947520844685:vitre6m1avi'
    query = f'\"{state}\" coronavirus relief donate'
    u = f'https://www.googleapis.com/customsearch/v1?key={key}&cx={cx}&q={query}'
    r = requests.get(u)
    results = r.json()
    links = []
    orgs = set()
    for result in results['items']:
        if 'news' in result['link'] or 'https' not in result['link'] or 'www' not in result['displayLink']:
            continue
        if result['displayLink'] in orgs or 'nytimes' in result['link'] or any(i in result['snippet'] for i in ['CEO', 'Feeding America', 'article', 'owner', 'sport', 'team']):
            continue
        links.append({'title': result['title'], 'link': result['link']})
        orgs.add(result['displayLink'])
    best = list(filter(lambda x: state in x['title'], links))
    other = list(filter(lambda x: state not in x['title'], links))
    return best + other

def getCovidHelpAll():
    d = {}
    to_state = {'AL': 'Alabama', 'AK': 'Alaska', 'AS': 'American Samoa', 'AZ': 'Arizona', 'AR': 'Arkansas', 'CA': 'California', 'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware', 'DC': 'District of Columbia', 'FL': 'Florida', 'GA': 'Georgia', 'GU': 'Guam', 'HI': 'Hawaii', 'ID': 'Idaho', 'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa', 'KS': 'Kansas', 'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland', 'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi', 'MO': 'Missouri', 'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada', 'NH': 'New Hampshire', 'NJ': 'New Jersey', 'NM': 'New Mexico', 'NY': 'New York', 'NC': 'North Carolina', 'ND': 'North Dakota', 'MP': 'Northern Mariana Islands', 'OH': 'Ohio', 'OK': 'Oklahoma', 'OR': 'Oregon', 'PA': 'Pennsylvania', 'PR': 'Puerto Rico', 'RI': 'Rhode Island', 'SC': 'South Carolina', 'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah', 'VT': 'Vermont', 'VI': 'Virgin Islands', 'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia', 'WI': 'Wisconsin', 'WY': 'Wyoming'}
    for state in to_state.values():
        d[state] = getCovidHelp(state)
    return d

def scrapeCountyInfo():
    r = requests.get('https://en.wikipedia.org/wiki/List_of_the_most_populous_counties_in_the_United_States')
    soup = BeautifulSoup(r.text)
    countydict = {}
    arr = soup.find_all(align="left")
    for i in range(0, len(arr)-1, 3):
        county = arr[i].text.replace('\n', '') + " County"
        state = arr[i+1].text.replace('\n', '')
        cities = []
        city = arr[i+2].text.replace('\n', '') 
        if "," in city:
            cities.append(city.split()[0])
        elif " and " in city:
            j = city.index(' and ')
            cities.append(city[:j])
            cities.append(city[j+5:])
        else:
            cities.append(city)
        countydict[(county, state)] = cities
    print(countydict)
    return countydict

 
