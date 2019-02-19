import pandas as pd
import re
import datetime
import tweet_functions
import sys

tweets = tweet_functions.tweets()
tweets_df = pd.read_pickle('trump_tweets.pickle')

def update_ngrams_all():
    tweets_df['ngrams'] = tweets_df['full_text'].apply(lambda x: tweets.get_ngrams(1, x.lower()))
    full_grams = tweets.get_ngrams(1, ' '.join(e.lower() for e in tweets_df.full_text))
    df = pd.DataFrame.from_dict(full_grams, orient='index')
    df = df[df[0] > 4]
    df['ngram'] = df.index
    max_year = tweets_df['created_at'].max().year

    idx = pd.MultiIndex.from_product([[e for e in range(2009, max_year + 1)], set(df['ngram'])], 
                                names=['year', 'tag'])

    ngram_df = pd.DataFrame(index = idx, columns = ['month_1', 'month_2', 'month_3', 'month_4', 'month_5', 
                                                    'month_6', 'month_7', 'month_8', 'month_9', 'month_10', 'month_11', 
                                                    'month_12'])

    tweets_df['ngrams_str'] = tweets_df['ngrams'].apply(lambda x: str(x))
    tweets_group_df = tweets_df.groupby(['year', 'month'])
    ctr = 0
    for year in ngram_df.index.get_level_values('year').unique():
        for month in range(1,13):
            try:
                phrase_df = tweets_group_df.get_group((year, month))
                for phrase in ngram_df.index.get_level_values('tag').unique():

                    word_df = phrase_df[phrase_df['ngrams_str'].str.contains(phrase, case=False)]
                    if len(word_df) == 0:
                        ngram_df.at[(year, phrase), 'month_{}'.format(month)] = ',,,;'
                    else:
                    #print (len(phrase_df))
                        ngram_df.at[(year, phrase), 'month_{}'.format(month)] = (str(len(word_df)) + ',' 
                            + str(word_df.sentiment.mean()) + ','  
                            + str(word_df.retweet_count.sum()) + ',' 
                            + str(word_df.favorited_count.mean()) +';')
                    

                    ctr += 1
                    sys.stdout.write('\r {} {} {} {} {}'.format(ctr, len(word_df), year, month, ctr / (len(ngram_df) * 12)))
            except KeyError:
                    #print (year, month)
                    pass
    ngram_df = ngram_df.fillna(',,,;')
    ngram_df = ngram_df.replace('nan', '0')
    ngram_df.fillna(',,,').to_csv('ngram_df_all_flattened.csv')
    print ('ngrams all done')

    

def update_ngrams_month():

    year = datetime.date.today().year
    month = datetime.date.today().month

    current_df = tweets_df.copy()
    current_df = current_df[(current_df['created_at'].apply(lambda x: x.year == year)) & (current_df['created_at'].apply(lambda x: x.month == month))]

    #running function
    text = ' '.join(e for e in current_df['full_text']).lower()

    bigrams = tweets.get_ngrams(3, text)

    bigram_df = pd.DataFrame.from_dict(bigrams.most_common()[:1000])
    print (bigram_df.columns, bigrams)
    bigram_df['grams'] = bigram_df[0]
    bigram_df['count'] = bigram_df[1]
    del bigram_df[0]
    del bigram_df[1]

    #bigram_df = bigram_df[bigram_df['count'] > 10]

    #updating data

    current_df['full_text_regex'] = current_df['full_text'].apply(lambda x: re.sub(r'[^ a-zA-Z0-9@\&]', '', x))
    current_df['full_text_regex'] = current_df['full_text_regex'].apply(lambda x: re.sub(r' {1,}', ' ', x))



    ctr = 0

    for index, row in bigram_df.iterrows():
        gram = bigram_df.loc[index, 'grams']
        df = current_df[current_df['full_text_regex'].str.contains(gram, case=False)]

        bigram_df.loc[index, 'sentiment'] = df['sentiment'].mean()
        bigram_df.loc[index, 'retweets'] = df['retweet_count'].sum()
        bigram_df.loc[index, 'favorites'] = df['favorited_count'].mean()

        ctr += 1
        sys.stdout.write('\r{}'.format(ctr))


    bigram_df.to_csv('bigram_month.csv')
    print ('ngrams month done')

if __name__ == '__main__':
    update_ngrams_all()
    update_ngrams_month()