import nltk
from nltk.tokenize import word_tokenize
import functools
import operator
from geotext import GeoText

stopwords = ['i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', "you're", "you've", "you'll", "you'd", 'your', 'yours', 'yourself', 'yourselves', 'he', 'him', 'his', 'himself', 'she', "she's", 'her', 'hers', 'herself', 'it', "it's", 'its', 'itself', 'they', 'them', 'their', 'theirs', 'themselves', 'what', 'which', 'who', 'whom', 'this', 'that', "that'll", 'these', 'those', 'am', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing', 'a', 'an', 'the', 'and', 'but', 'if', 'or', 'because', 'as', 'until', 'while', 'of', 'at', 'by', 'for', 'with', 'about', 'against', 'between', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'to', 'from', 'up', 'down', 'in', 'out', 'on', 'off', 'over', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 's', 't', 'can', 'will', 'just', 'don', "don't", 'should', "should've", 'now', 'd', 'll', 'm', 'o', 're', 've', 'y', 'ain', 'aren', "aren't", 'couldn', "couldn't", 'didn', "didn't", 'doesn', "doesn't", 'hadn', "hadn't", 'hasn', "hasn't", 'haven', "haven't", 'isn', "isn't", 'ma', 'mightn', "mightn't", 'mustn', "mustn't", 'needn', "needn't", 'shan', "shan't", 'shouldn', "shouldn't", 'wasn', "wasn't", 'weren', "weren't", 'won', "won't", 'wouldn', "wouldn't"]

state_names = ['alabama', 'alaska', 'arizona', 'arkansas', 'california', 'colorado', 'connecticut', 'delaware', 'florida', 'georgia', 'hawaii', 'idaho', 'illinois', 'indiana', 'iowa', 'kansas', 'kentucky', 'louisiana', 'maine', 'maryland', 'massachusetts', 'michigan', 'minnesota', 'mississippi', 'missouri', 'montana', 'nebraska', 'nevada', 'hampshire', 'jersey', 'carolina', 'dakota', 'new hampshire', 'new jersey', 'new mexico', 'new york', 'north carolina', 'north dakota', 'ohio', 'oklahoma', 'oregon', 'pennsylvania', 'rhode island', 'south carolina', 'south dakota', 'tennessee', 'texas', 'utah', 'vermont', 'virginia', 'washington', 'west virginia', 'wisconsin', 'wyoming']
countydict = {('Los Angeles County', 'California'): ['Los Angeles'], ('Cook County', 'Illinois'): ['Chicago'], ('Harris County', 'Texas'): ['Houston'], ('Maricopa County', 'Arizona'): ['Phoenix'], ('San Diego County', 'California'): ['San Diego'], ('Orange County', 'California'): ['Santa Ana'], ('Miami-Dade County', 'Florida'): ['Miami'], ('Dallas County', 'Texas'): ['Dallas'], ('Kings County', 'New York'): ['Brooklyn'], ('Riverside County', 'California'): ['Riverside'], ('Queens County', 'New York'): ['Queens'], ('King County', 'Washington'): ['Seattle'], ('Clark County', 'Nevada'): ['Las Vegas'], ('San Bernardino County', 'California'): ['San Bernardino'], ('Tarrant County', 'Texas'): ['Fort Worth'], ('Bexar County', 'Texas'): ['San Antonio'], ('Broward County', 'Florida'): ['Fort Lauderdale'], ('Santa Clara County', 'California'): ['San Jose'], ('Wayne County', 'Michigan'): ['Detroit'], ('Alameda County', 'California'): ['Oakland'], ('New York County', 'New York'): ['Manhattan', 'New York City'], ('Middlesex County', 'Massachusetts'): ['Lowell', 'Cambridge'], ('Philadelphia County', 'Pennsylvania'): ['Philadelphia'], ('Sacramento County', 'California'): ['Sacramento'], ('Palm Beach County', 'Florida'): ['West Palm Beach'], ('Suffolk County', 'New York'): ['Riverhead'], ('Hillsborough County', 'Florida'): ['Tampa'], ('Bronx County', 'New York'): ['Bronx'], ('Nassau County', 'New York'): ['Mineola'], ('Orange County', 'Florida'): ['Orlando'], ('Franklin County', 'Ohio'): ['Columbus'], ('Hennepin County', 'Minnesota'): ['Minneapolis'], ('Oakland County', 'Michigan'): ['Pontiac'], ('Travis County', 'Texas'): ['Austin'], ('Cuyahoga County', 'Ohio'): ['Cleveland'], ('Allegheny County', 'Pennsylvania'): ['Pittsburgh'], ('Salt Lake County', 'Utah'): ['Salt Lake City'], ('Fairfax County', 'Virginia'): ['Fairfax'], ('Contra Costa County', 'California'): ['Martinez'], ('Mecklenburg County', 'North Carolina'): ['Charlotte'], ('Wake County', 'North Carolina'): ['Raleigh'], ('Montgomery County', 'Maryland'): ['Rockville'], ('Fulton County', 'Georgia'): ['Atlanta'], ('Pima County', 'Arizona'): ['Tucson'], ('Collin County', 'Texas'): ['McKinney'], ('St. Louis County', 'Missouri'): ['Clayton'], ('Richmond County', 'New York'): ['Staten Island'], ('Fresno County', 'California'): ['Fresno'], ('Honolulu County', 'Hawaii'): ['Honolulu'], ('Pinellas County', 'Florida'): ['Clearwater'], ('Westchester County', 'New York'): ['White Plains'], ('Marion County', 'Indiana'): ['Indianapolis'], ('Duval County', 'Florida'): ['Jacksonville'], ('Milwaukee County', 'Wisconsin'): ['Milwaukee'], ('Fairfield County', 'Connecticut'): ['Bridgeport'], ('Bergen County', 'New Jersey'): ['Hackensack'], ('Shelby County', 'Tennessee'): ['Memphis'], ('DuPage County', 'Illinois'): ['Wheaton'], ('Gwinnett County', 'Georgia'): ['Lawrenceville'], ('Erie County', 'New York'): ['Buffalo'], ("Prince George's County", 'Maryland'): ['Upper Marlboro'], ('Kern County', 'California'): ['Bakersfield'], ('Hartford County', 'Connecticut'): ['Hartford'], ('Pierce County', 'Washington'): ['Tacoma'], ('San Francisco County', 'California'): ['San Francisco'], ('Macomb County', 'Michigan'): ['Mount Clemens'], ('Hidalgo County', 'Texas'): ['Edinburg'], ('Denton County', 'Texas'): ['Denton'], ('New Haven County', 'Connecticut'): ['New Haven'], ('Ventura County', 'California'): ['Ventura'], ('El Paso County', 'Texas'): ['El Paso'], ('Worcester County', 'Massachusetts'): ['Worcester'], ('Middlesex County', 'New Jersey'): ['New Brunswick'], ('Montgomery County', 'Pennsylvania'): ['Norristown'], ('Baltimore County', 'Maryland'): ['Towson'], ('Hamilton County', 'Ohio'): ['Cincinnati'], ('Snohomish County', 'Washington'): ['Everett'], ('Multnomah County', 'Oregon'): ['Portland'], ('Suffolk County', 'Massachusetts'): ['Boston'], ('Essex County', 'New Jersey'): ['Newark'], ('Oklahoma County', 'Oklahoma'): ['Oklahoma City'], ('Essex County', 'Massachusetts'): ['Salem', 'Lawrence'], ('Fort Bend County', 'Texas'): ['Richmond'], ('Jefferson County', 'Kentucky'): ['Louisville'], ('San Mateo County', 'California'): ['Redwood City'], ('Cobb County', 'Georgia'): ['Marietta'], ('DeKalb County', 'Georgia'): ['Decatur'], ('Lee County', 'Florida'): ['Fort Myers'], ('San Joaquin County', 'California'): ['Stockton'], ('Monroe County', 'New York'): ['Rochester'], ('Denver County', 'Colorado'): ['Denver'], ('El Paso County', 'Colorado'): ['Colorado Springs'], ('Polk County', 'Florida'): ['Bartow'], ('Norfolk County', 'Massachusetts'): ['Dedham']}

# flattens a list of form [[a,b], [c,d], ...]
def flatten(l):
    l = [x.split() for x in l]
    return functools.reduce(operator.iconcat, l, [])

# how many words overlap between the two lists of words
def overlap(l1, l2):
    return len(set(l1) & set(l2))

# updates dictionaries with mapping of word to number of occurrences
def update_dicts(t, state, county, d, d2, d3):
    stopw = stopwords + [state.lower(), 'n\'t', 'updates', 'times', 'tribune', 'wilkes-barre', 'abc', 'ctv', 'news', 'u.s.', 'us', 'covid-19', 'covid', 'coronavirus', 'could', 'would']
    for w in t:
        if w in stopw or w in county.lower() or w in ['north', 'south', 'east', 'west', 'new', 'amid']:
            continue
        if state != 'United States' and w in state_names:
            continue
        if w in d.keys():
            d[w] += 1
        else:
            d[w] = 1
    bigrams = nltk.bigrams(t)
    for b in bigrams:
        w = b[0] + ' ' + b[1]
        if any(i in stopw for i in b) or 'county' in b or w in county.lower() or w in [state.lower(), county.lower(), 'united states', 'experts say', 'data shows']:
            continue
        if state != 'United States' and w in state_names or b[0] in state_names or b[1] in state_names:
            continue
        if w in d2.keys():
            d2[w] += 1
        else:
            d2[w] = 1
    trigrams = nltk.trigrams(t)
    for b in trigrams:
        w = b[0] + ' ' + b[1] + ' ' + b[2]
        if 'the' in w or 'coronavirus' in w or b[0] in stopw or b[2] in stopw or w == county.lower():
            continue
        if state != 'United States' and any(i in state_names for i in b):
            continue
        if w in d3.keys():
            d3[w] += 1
        else:
            d3[w] = 1
    return

def ranker(x, state, county, top_all):
    points = 0
    if county and county in x['title']:
        points += 50
    if state in x['title'] or 'reopen' in x['title']:
        points += 50
    if state == 'United States' and 'US' in x['title'] or 'U.S.' in x['title']:
        points += 50
    elif any(i in state_names for i in x['title']):
        points -= 50
    for i in range(len(top_all)):
        if top_all[i] in x['title']:
            points += 10-i
    return points

def filter_news(headlines, state, county):
    # filter out if: duplicate, doesn't contain state/county
    # identify hotspots? search keywords that correspond to locations - GeoText, geopy - TODO
    n = headlines['totalResults']
    d, d2, d3 = {}, {}, {}
    i = 0
    # sort headlines alphabetically by title so it's easier to find duplicates
    headlines = sorted(headlines['articles'], key=lambda x: x['title'].lower())
    results, prev = [], None
    for i in range(len(headlines)):
        title = headlines[i]['title'].lower()
        if headlines[i]['source']['name'].lower() in title:
            title = title.replace(headlines[i]['source']['name'].lower(), '')
        if ' - ' in title:
            rind = title.rindex(' - ')
            if 'news' in title[rind+3:] or 'reuters' in title[rind+3:] or title[rind+3:] in headlines[i]['source']['name'].lower():
                title = title[:rind]
        # filter out if doesn't contain name of county or state
        if county:
            if (county, state) in countydict:
                cont = True
                for x in [county] + countydict[(county, state)]:
                    if x.lower() in title or headlines[i]['description'] and x.lower() in headlines[i]['description'].lower():
                        cont = False
                if cont:
                    # print(title)
                    continue
            elif county.lower() not in title and headlines[i]['description'] and county.lower() not in headlines[i]['description'].lower() and county[:len(county) - len("County ")].lower() not in headlines[i]['title'].lower() and county[:len(county) - len("County ")].lower() not in headlines[i]['description'].lower():
                continue
        elif state and state.lower() not in title and headlines[i]['description'] and state.lower() not in headlines[i]['description'].lower():
            if state != 'United States':
                continue
            elif headlines[i]['description'] and not any(j in title or j in headlines[i]['description'].lower() for j in [state.lower(), 'u.s.', 'trump'] + state_names):
                continue
        t = word_tokenize(title)
        if prev and overlap(prev, t) > 0.9*max(len(prev), len(t)):
            continue
        prev = t
        
        t = list(filter(lambda x: len(x) > 1 and x != "'s", t))

        update_dicts(t, state, county, d, d2, d3)
        
        results.append(headlines[i])

    # isolate bigrams and trigrams with more than one occurrence
    top3 = list(filter(lambda x: x[1] > 1, sorted(d3.items(), key=lambda x:x[1], reverse=True)))
    top3 = list(map(lambda x: x[0], top3))
    top2 = list(filter(lambda x: x[1] > 1, sorted(d2.items(), key=lambda x:x[1], reverse=True)))
    top2 = list(map(lambda x: x[0], top2))

    # remove overlapping trigrams
    top_all = list(top3)
    for i in range(len(top3)):
        for j in range(i+1, len(top3)):
            if top3[j] in top_all and (overlap(top3[i].split(), top3[j].split()) > 1 or top3[i].split()[2] == top3[j].split()[0]):
                top_all.remove(top3[j])
    top_all = top_all[:4]
    # remove overlapping bigrams
    for x in top_all:
        for y in list(top2):
            if y in x or overlap(x.split(), y.split()) > 0:
                top2.remove(y)
    top_all += top2
    top_all = top_all[:7]
    # remove overlapping unigrams
    top = list(filter(lambda x: x[1] > 1 and x[0] not in flatten(top_all) and x[0][0].isalpha(), \
        sorted(d.items(), key=lambda x: (x[1], len(x[0])), reverse=True)))
    top = list(map(lambda x: x[0], top))
    
    top_all += top

    top_all = top_all[:10]
    results = sorted(results, key=lambda x: ranker(x, state, county, top_all), reverse=True)

    prev = None
    results1, results2 = [], []
    for res in results:
        t = word_tokenize(res['title'])
        if prev and overlap(prev, t) > 0.7*max(len(prev), len(t)):
            results2.append(res)
            continue
        results1.append(res)
        prev = t

    return {'articles': results1 + results2, 'totalResults': n, 'keywords': top_all}

def get_cities(headlines):
    d = {}
    for h in headlines['articles']:
        cities = GeoText(h['title']).cities + GeoText(h['description']).cities
        print(cities)
        for city in cities:
            if city in d.keys():
                d[city] += 1
            else:
                d[city] = 1
    print(sorted(d.items(), key=lambda x: x[1], reverse=True))
    return d
