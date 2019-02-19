import pandas as pd
import numpy as np
import sys
from selenium.webdriver.common.desired_capabilities import DesiredCapabilities
from fake_useragent import UserAgent
from selenium import webdriver
from bs4 import BeautifulSoup
import requests
import codecs
import random
import json
import time
from datetime import datetime
import calendar

class tweets(object):
    ctr = 0
    missing_dates = pd.DataFrame(columns = ['year', 'month', 'day', 'user'])

    global_headers = None
    global_last_response = None

    def println(self, text):
        sys.stdout.write('\r' + " " * 200) ## clear stdout
        sys.stdout.write('\r' + text)
        
    def get_element_or_fail(self, data, element):
        if element in data:
            data[element]
        else:
            raise ValueError('Can not find ' + str(element) + ' in data: ' + str(data))

    def get_headers(self):
        DEFAULT_BEARER = (
            "Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOu"
            "H5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA"
        )

        ua = UserAgent()

        def get_guest_token():
            """Using Selenium to get the guest token"""

            # Setting the user agent
            user_agent = dict(DesiredCapabilities.CHROME)
            user_agent["Chrome.page.settings.userAgent"] = (
                "Twitter-iPhone/6.45 iOS/9.0.2 (Apple;iPhone8,2;;;;;1)"
            )
            # Setting the driver in this case Chrome
            options = webdriver.ChromeOptions()
            options.add_argument('headless')
            driver = webdriver.Chrome(options = options)
            # Navigating to the base url
            driver.get("https://mobile.twitter.com/")
            # Executing javascript and return the token using regula expression
            guest_token = driver.execute_script(
            "return document.cookie.match('(^|;) ?gt=([^;]*)(;|$)')[2];")
            return guest_token

        # Global Headers for interacting with the API
        return {
            'User-Agent':
            ua.random,
            'Authorization':DEFAULT_BEARER,
            'x-guest-token':str(get_guest_token())
        }


    def search_tweets(self, user_choice, max_tweets, user_id, search_term=None):
        #self.global_headers
        #self.global_last_response
        
        # Timeline API url
        timeline_url = "https://api.twitter.com/2/timeline/profile/{0}.json".format(str(user_id))
        # Advanced Search API URL
        advanced_search_url = "https://api.twitter.com/2/search/adaptive.json"
        # Defining url parameters
        params = {
                  'include_profile_interstitial_type':'1',
                  'include_blocking':'0',
                  'include_blocked_by':'0',
                  'include_followed_by':'0',
                  'include_want_retweets':'0',
                  'skip_status':'0',
                  'cards_platform':'Web-12',
                  'include_cards':'1',
                  'include_ext_alt_text':'true',
                  'include_reply_count':'0',
                  'tweet_mode':'extended',
                  'include_entities':'true',
                  'include_user_entities':'true',
                  'include_ext_media_color':'false',
                  'send_error_codes':'false',
                  'include_tweet_replies':'false',
                  'include_tweet_retweets': 'false',
                  'userId':str(user_id),
                  'count':'200',
                  'cursor':None,
                  'q':None,
                  'query_source':True,
                  'pc':1,
                  'spelling_corrections':None
        }

        # Setting search paramaters depending on the search type
        if str(user_choice) == 'search_timeline':
            search_url = timeline_url
            params['userId'] = str(user_id)
            params.pop('query_source')
            #params.pop('pc')
            params.pop('spelling_corrections')
            params.pop('q')
        elif str(user_choice) == 'advanced_search':
            search_url = advanced_search_url
            params.pop('userId')
            params['q'] = str(search_term)
            params['query_source'] = 'typed_query'
            params['pc'] = '1'
            params['spelling_corrections'] = '1'

        # Store all tweets in a list
        all_results = list()

        rate_limit_remaining_calls = None
        rate_limit_attempts = 0
        max_count = 0
        while max_count < max_tweets:
            get_tweets = requests.get(search_url, params=params, headers=self.global_headers)
            
            try:
                tweets_call = get_tweets.json()
                self.global_last_response = tweets_call
            except:
                raise ValueError('Can not convert response to JSON. Last response: ' + str(get_tweets))
            
            if 'x-rate-limit-remaining' in get_tweets.headers:
                rate_limit_remaining_calls = int(get_tweets.headers['x-rate-limit-remaining'])
                                
            if 'errors' in tweets_call:
                if (len(tweets_call['errors']) == 1) & (tweets_call['errors'][0]['code'] == 88):
                    if 'x-rate-limit-reset' not in get_tweets.headers:
                        raise ValueError('No x-rate-limit-reset header while fetching tweets. Last response: ' + str(tweets_call))
                    else:
                        seconds_left_to_rate_limit_reset = max(int(get_tweets.headers['x-rate-limit-reset']) - calendar.timegm(datetime.utcnow().utctimetuple()), 0)

                    if rate_limit_attempts < 5:
                        self.println('\rRate limit exceedeed. Getting new guest token, attempt ' + str(rate_limit_attempts) + '. ' + str(pd.datetime.now()))
                        self.global_headers = self.get_headers()
                        rate_limit_attempts = rate_limit_attempts + 1
                        continue
                    else:
                        rate_limit_attempts = 0
                        self.println('\rRate limit exceedeed. Sleeping for ' + str(seconds_left_to_rate_limit_reset) + ' seconds. ' + str(pd.datetime.now()))
                        time.sleep(seconds_left_to_rate_limit_reset + 10)
                        continue
                else:
                    raise ValueError('Unexpected error while fetching tweets. Last response: ' + str(tweets_call))
            
            tweets = tweets_call['globalObjects']['tweets']

            for i in tweets:
                if (tweets[i]['user_id'] != user_id):##!!! 
                    continue##!!! 
                # Count tweet stop if limit
                max_count += 1
                # ~print(tweets[i], '\n\n')
                # Create dict and add tweets
                partial_dict = {
                    'hashtags':list(),
                    'mentions':list(),
                    'urls':list(),
                    'created_at':None,
                    'retweet_count':None,
                    'favorited_count':None,
                }

                # Find Full Text of the tweet
                partial_dict['full_text'] = tweets[i]['full_text']
                # Find retweet count
                try:
                    partial_dict['retweet_count'] = tweets[i]['retweet_count']
                except:
                    pass
                # Find favorited count
                try:
                    partial_dict['favorited_count'] = tweets[i]['favorite_count']
                except:
                    pass
                # Find hashtags in tweet
                try:
                    hashtags = tweets[i]['entities']['hashtags']
                    for hashtag in hashtags:
                        partial_dict['hashtags'].append(hashtag['text'])
                except KeyError:
                    pass

                # Find mentions in tweet
                try:
                    mentions = tweets[i]['entities']['user_mentions']
                    for mention in mentions:
                        partial_dict['mentions'].append(mention['screen_name'])
                except KeyError:
                    pass

                # Find urls in tweet
                try:
                    urls = tweets[i]['entities']['urls']
                    for url in urls:
                        partial_dict['urls'].append(url['expanded_url'])
                except KeyError:
                    pass

                # Find date
                try:
                    partial_dict['created_at'] = tweets[i]['created_at']
                except KeyError:
                    pass

                #favorite_count = tweets[i]['favorite_count']
                #partial_dict['favorite_count'] = str(favorite_count)
                all_results.append(partial_dict)

                
            
            #update the cursor with next page id
            try:
                check_cursor = tweets_call['timeline']['instructions'][0]['addEntries']['entries']
                cursor = check_cursor[-1]['content']['operation']['cursor']['value']
                
                # If cursor reaches the last page break
                if int(len(check_cursor)) < 3:
                    break
                params['cursor'] = str(cursor)
            except (KeyError, IndexError):
                break


        return all_results, rate_limit_remaining_calls

    def sort_func(self, time_item):
        """Function to sort a list of dicts based on timestamp"""
        datetime_string = time_item['created_at']
        # We have dates like, Mon Apr 26 14:59:19 +0000 2010
        # and we want to convert them to timestamps, so you can sort them after.
        converted_timestamp = time.strftime(
            '%Y-%m-%d %H:%M:%S',
            time.strptime(datetime_string, '%a %b %d %H:%M:%S +0000 %Y')
        )
        return converted_timestamp

    # def get_bio(user):
    #     r = requests.get("https://twitter.com/{0}".format(user), headers=HEADERS)
    #     soup = BeautifulSoup(r.content, "lxml")
    #     get_json = (soup.find("input", {"class":"json-data"}))['value']
    #     parse_description = json.loads(get_json)['profile_user']
    #     return(parse_description['description'])

    def get_user_id(self, user):##!!!
        params = {'screen_name': user}##!!!
        response = requests.get('https://api.twitter.com/1.1/users/lookup.json', params=params, headers=self.global_headers).json() ##!!!
        return response[0]['id']##!!!


    def get_tweets_all(self, df, user, from_date, to_date):
            
        #self.global_last_response
        #self.global_headers
        self.global_headers = self.get_headers()
        user_id = self.get_user_id(user)
        
        MAX_TWEETS = 1000
        
        for date in pd.date_range(from_date, to_date):
            nextDate = date + pd.Timedelta('1 day')

            SEARCH_QUERY = "from:{0} since:{1}-{2}-{3} until:{4}-{5}-{6}".format(
                user, date.year, date.month, date.day, nextDate.year, nextDate.month, nextDate.day
            )
            try:
                result, rate_limit_remaining_calls = self.search_tweets(user_id=user_id, user_choice='advanced_search', max_tweets=MAX_TWEETS, search_term=SEARCH_QUERY)
            except BaseException as exception:
                print('Last response: ' + str(self.global_last_response))
                raise exception
                
            sorted_result = sorted(result, key=self.sort_func)
            #print(sorted_result)


            #with open('twitter.json', 'wb') as f:
            #    json.dump(sorted_result, codecs.getwriter('utf-8')(f), ensure_ascii=False)
            #    f.close()

            #print(random.choice(sorted_result))
            #filtered_search = list(filter(lambda word: 'PEP' in word['full_text'], sorted_result))
            #print(filtered_search)

            person_df = pd.DataFrame(sorted_result)
            person_df['handle'] = user
            df = df.append(person_df)

            sys.stdout.write('\rfetched tweets so far: {}, year: {}, month: {}, day: {}, num_tweets = {}, user = {}, remaining calls until rate limit = {}          '.format(len(df), 
                                                                                            date.year, date.month, date.day, len(df[df['handle'] == user]), user, rate_limit_remaining_calls))            
            if len(sorted_result) == 0:
                self.missing_dates.loc[self.ctr, 'year'] = date.year
                self.missing_dates.loc[self.ctr, 'month'] = date.month
                self.missing_dates.loc[self.ctr, 'day'] = date.day
                self.missing_dates.loc[self.ctr, 'user'] = user
                self.ctr += 1
                continue
        return df


    def get_ngrams(self, n, text):
        from collections import Counter
        import operator
        import re
        
        text = re.sub(r'[^ a-zA-Z0-9@\&]', '', text)
        text = re.sub(r' {1,}', ' ', text)
        split_text = text.split(' ')
        end_of_text = len(split_text)
        beginning = 0
        end = n
        
        ngram_lst = Counter()
        while end < end_of_text:
            ngram = ' '.join(word for word in split_text[beginning:end])
            if ngram not in ngram_lst.keys():
                ngram_lst[ngram] = 1
            else:
                ngram_lst[ngram] += 1
            beginning += 1
            end += 1
        return ngram_lst


