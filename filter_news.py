import nltk
from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords
import functools
import operator

# flattens a list of form [[a,b], [c,d], ...]
def flatten(l):
	l = [x.split() for x in l]
	return functools.reduce(operator.iconcat, l, [])

# how many words overlap between the two lists of words
def overlap(l1, l2):
	return len(set(l1) & set(l2))

# updates dictionaries with mapping of word to number of occurrences
def update_dicts(t, state, county, d, d2, d3):
	for w in t:
		if w in stopwords.words('english') or w in \
		[state.lower(), county.lower(), 'covid-19', 'coronavirus', 'could']:
			continue
		if w in d.keys():
			d[w] += 1
		else:
			d[w] = 1
	bigrams = nltk.bigrams(t)
	for b in bigrams:
		w = b[0] + ' ' + b[1]
		if any(i in ['the', 'coronavirus', 'and', 'in', 'or', 'of', 'that', 'to', state.lower()] for i in b):
			continue
		if w in d2.keys():
			d2[w] += 1
		else:
			d2[w] = 1
	trigrams = nltk.trigrams(t)
	for b in trigrams:
		w = b[0] + ' ' + b[1] + ' ' + b[2]
		if 'the' in w or 'coronavirus' in w:
			continue
		if w in d3.keys():
			d3[w] += 1
		else:
			d3[w] = 1
	return

def filter_news(headlines, state, county):
	# filter out if: duplicate, doesn't contain state/county
	# sort by: contains trending keywords (unigrams, bigrams, trigrams) - TODO
	# identify hotspots? search keywords that correspond to locations - GeoText, geopy - TODO
	n = headlines['totalResults']
	d, d2, d3 = {}, {}, {}
	i = 0
	# these are meant to map keyword to article for ranking purposes - TODO
	d_titles, d2_titles, d3_titles = {}, {}, {}
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
			if county.lower() not in title and headlines[i]['description'] and county.lower() not in headlines[i]['description'].lower():
				continue
		elif state and state.lower() not in title and headlines[i]['description'] and state.lower() not in headlines[i]['description'].lower():
			continue

		t = word_tokenize(title)

		# filter out if duplicate/more than 70% similar
		if prev and overlap(prev, t) > 0.7*max(len(prev), len(t)):
			if headlines[i]['source']['name'] < headlines[i-1]['source']['name']:
				results.pop() # pop previous copy
			else:
				continue # skip this copy
		prev = t
		
		t = list(filter(lambda x: len(x) > 1 and x != "'s", t))

		update_dicts(t, state, county, d, d2, d3)
		
		results.append(headlines[i])

	# isolate bigrams and trigrams with more than one occurrence
	top3 = list(filter(lambda x: x[1] > 1, sorted(d3.items(), key=lambda x:x[1], reverse=True)))
	print(top3)
	top3 = list(map(lambda x: x[0], top3))
	top2 = list(filter(lambda x: x[1] > 1, sorted(d2.items(), key=lambda x:x[1], reverse=True)))
	print(top2)
	top2 = list(map(lambda x: x[0], top2))

	# remove overlapping trigrams
	top_all = list(top3)
	for i in range(len(top3)):
		for j in range(i+1, len(top3)):
			if top3[j] in top_all and overlap(top3[i].split(), top3[j].split()) > 1:
				top_all.remove(top3[j])
	# remove overlapping bigrams
	for x in top_all:
		for y in list(top2):
			if y in x:
				top2.remove(y)
	top_all += top2
	# remove overlapping unigrams
	top = list(filter(lambda x: x[1] > 1 and x[0] not in flatten(top_all) and x[0][0].isalpha(), \
		sorted(d.items(), key=lambda x:x[1], reverse=True)))
	print(top)
	top = list(map(lambda x: x[0], top))
	
	top_all += top

	print("\ntop selected keywords: ", top_all)
		
	return {'articles': results, 'totalResults': n, 'keywords': top_all[:7]}
