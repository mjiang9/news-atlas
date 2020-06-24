import nltk
from nltk.tokenize import word_tokenize
import functools
import operator
from geotext import GeoText

stopwords = ['i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', "you're", "you've", "you'll", "you'd", 'your', 'yours', 'yourself', 'yourselves', 'he', 'him', 'his', 'himself', 'she', "she's", 'her', 'hers', 'herself', 'it', "it's", 'its', 'itself', 'they', 'them', 'their', 'theirs', 'themselves', 'what', 'which', 'who', 'whom', 'this', 'that', "that'll", 'these', 'those', 'am', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing', 'a', 'an', 'the', 'and', 'but', 'if', 'or', 'because', 'as', 'until', 'while', 'of', 'at', 'by', 'for', 'with', 'about', 'against', 'between', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'to', 'from', 'up', 'down', 'in', 'out', 'on', 'off', 'over', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 's', 't', 'can', 'will', 'just', 'don', "don't", 'should', "should've", 'now', 'd', 'll', 'm', 'o', 're', 've', 'y', 'ain', 'aren', "aren't", 'couldn', "couldn't", 'didn', "didn't", 'doesn', "doesn't", 'hadn', "hadn't", 'hasn', "hasn't", 'haven', "haven't", 'isn', "isn't", 'ma', 'mightn', "mightn't", 'mustn', "mustn't", 'needn', "needn't", 'shan', "shan't", 'shouldn', "shouldn't", 'wasn', "wasn't", 'weren', "weren't", 'won', "won't", 'wouldn', "wouldn't"]

state_names = ['alabama', 'alaska', 'arizona', 'arkansas', 'california', 'colorado', 'connecticut', 'delaware', 'florida', 'georgia', 'hawaii', 'idaho', 'illinois', 'indiana', 'iowa', 'kansas', 'kentucky', 'louisiana', 'maine', 'maryland', 'massachusetts', 'michigan', 'minnesota', 'mississippi', 'missouri', 'montana', 'nebraska', 'nevada', 'hampshire', 'jersey', 'carolina', 'dakota', 'new hampshire', 'new jersey', 'new mexico', 'new york', 'north carolina', 'north dakota', 'ohio', 'oklahoma', 'oregon', 'pennsylvania', 'rhode island', 'south carolina', 'south dakota', 'tennessee', 'texas', 'utah', 'vermont', 'virginia', 'washington', 'west virginia', 'wisconsin', 'wyoming']

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
	if state in x['title']:
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
	prev = None
	results = []
	for i in range(len(headlines)):
		title = headlines[i]['title'].lower()
		if headlines[i]['source']['name'].lower() in title:
			title = title.replace(headlines[i]['source']['name'].lower(), '')

		# filter out if doesn't contain name of county or state
		if county:
			if county.lower() not in title and headlines[i]['description'] and county.lower() not in headlines[i]['description'].lower() and county[:len(county) - len("County ")].lower() not in headlines[i]['title'].lower():
				continue
		elif state and state.lower() not in title and headlines[i]['description'] and state.lower() not in headlines[i]['description'].lower():
			if state != 'United States':
				continue
			elif headlines[i]['description'] and not any(j in title or j in headlines[i]['description'].lower() for j in [state.lower(), 'u.s.', 'trump'] + state_names):
				continue
		t = word_tokenize(title)

		# filter out if duplicate/more than 70% similar
		if prev and overlap(prev, t) > 0.7*max(len(prev), len(t)):
			if headlines[i]['source']['name'] < headlines[i-1]['source']['name']:
				results.pop() # pop previous copy
			else:
				continue # skip this copy
		prev = list(t)
		
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
			if top3[j] in top_all and overlap(top3[i].split(), top3[j].split()) > 1:
				top_all.remove(top3[j])
	top_all = top_all[:4]
	# remove overlapping bigrams
	for x in top_all:
		for y in list(top2):
			if y in x:
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

	return {'articles': results, 'totalResults': n, 'keywords': top_all}

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
