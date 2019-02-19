import pandas as pd
import re
import sys
import tweet_functions
import datetime

tweets = tweet_functions.tweets()

tweets_df = pd.read_pickle('trump_tweets.pickle')

current_df = tweets_df[tweets_df['created_at'].apply(lambda x: 
    x.month == datetime.date.today().month and x.year == datetime.date.today().year)]

current_df['day'] = current_df['created_at'].apply(lambda x: x.day)

max_year = tweets_df['created_at'].max().year

def update_mentions_all(tweets_df=tweets_df):
    mentions_set = set()

    for lst in tweets_df.mentions:
        if len(lst) < 1:
            pass
        else:
            for name in lst:
                mentions_set.add(name)

    idx = pd.MultiIndex.from_product([[e for e in range(2009, max_year + 1)], mentions_set], 
                                names=['year', 'mention'])

    mentions_df = pd.DataFrame(index = idx, columns = ['month_1', 'month_2', 'month_3', 'month_4', 'month_5', 
                                                'month_6', 'month_7', 'month_8', 'month_9', 'month_10', 'month_11', 
                                                'month_12'])

    tweets_df['mentions_str'] = tweets_df['mentions'].apply(lambda x: str(x))
    tweets_group_df = tweets_df.groupby(['year', 'month'])
    ctr = 0
    for year in mentions_df.index.get_level_values('year').unique():
        for month in range(0,13):
            try:
                time_df = tweets_group_df.get_group((year, month))
                for tag in mentions_df.index.get_level_values('mention').unique():

                    word_df = time_df[time_df['mentions_str'].str.contains(tag, case=False)]
                    if len(word_df) == 0:
                        mentions_df.at[(year, tag), 'month_{}'.format(month)] = ',,,;'
                    else:
                    #print (len(phrase_df))
                        mentions_df.at[(year, tag), 'month_{}'.format(month)] = (str(len(word_df)) + ',' +
                         str(word_df.sentiment.mean()) + ',' + 
                         str(word_df.retweet_count.sum()) + ',' + 
                         str(word_df.favorited_count.sum()) + ';')


                    ctr += 1
                    sys.stdout.write('\r {} {} {} {} {}'.format(ctr, len(word_df), year, month, ctr / (len(mentions_df) * 12)))
            except KeyError:
                    pass
    mentions_df = mentions_df.fillna(',,,;')
    mentions_df.replace('nan', '0', inplace=True)

    flattened_mention_df = pd.DataFrame()

    for name in mentions_df.index.get_level_values('mention').unique():
        name_df = mentions_df.xs(name, level=1)
        for year, row in zip(range(2009, max_year + 1), name_df.get_values()):
            flattened_mention_df.loc[name, year] = ''.join(e for e in row)
        sys.stdout.write('\r {}'.format(len(flattened_mention_df) / 
                                        len(mentions_df.index.get_level_values('mention').unique())))

    flattened_mention_df.index = flattened_mention_df.index.rename('tag')

    flattened_mention_df.to_csv('mention_df_flattened.csv')
    print ('mentions all done')
            
    
    
    
    
    

def update_mentions_month(current_df = current_df):

    mention_df = pd.DataFrame(columns = ['day', 'tag', 'sentiment', 'retweets', 'likes'])
    ctr = 0
    for day in current_df.day.unique():
        series = current_df.groupby('day').get_group(day)['mentions']
        feelings = current_df.groupby('day').get_group(day)['sentiment']
        retweets = current_df.groupby('day').get_group(day)['retweet_count']
        likes =  current_df.groupby('day').get_group(day)['favorited_count']


        for lst, sentiment, retweet, like in zip(series, feelings, retweets, likes):
            if not isinstance(lst, list):
                pass
            else:
                for mention in lst:
                    mention_df.loc[ctr, 'day'] = day
                    mention_df.loc[ctr, 'tag'] = mention
                    mention_df.loc[ctr, 'sentiment'] = pd.Series(sentiment).mean()
                    mention_df.loc[ctr, 'retweets'] = pd.Series(retweet).sum()
                    mention_df.loc[ctr, 'likes'] = pd.Series(like).sum()
                    ctr += 1
        if len(mention_df[mention_df['day'] == day]) == 0:
            mention_df.loc[ctr, 'day'] = day
            mention_df.loc[ctr, 'tag'] = None
            ctr += 1
            print (ctr)


    mention_df.to_csv('mention_df.csv')
    print ('mentions month done')


def update_hashtags_all(tweets_df=tweets_df):
    hashtag_set = set()

    for lst in tweets_df.hashtags:
        if len(lst) < 1:
            pass
        else:
            for name in lst:
                hashtag_set.add(name)

    idx = pd.MultiIndex.from_product([[e for e in range(2009, max_year + 1)], hashtag_set], 
                                names=['year', 'hashtag'])

    hashtag_df = pd.DataFrame(index = idx, columns = ['month_1', 'month_2', 'month_3', 'month_4', 'month_5', 
                                                    'month_6', 'month_7', 'month_8', 'month_9', 'month_10', 'month_11', 
                                                    'month_12'])

    tweets_df['hashtag_str'] = tweets_df['hashtags'].apply(lambda x: str(x))
    tweets_group_df = tweets_df.groupby(['year', 'month'])
    ctr = 0
    for year in hashtag_df.index.get_level_values('year').unique():
        for month in range(0,13):
            try:
                time_df = tweets_group_df.get_group((year, month))
                for tag in hashtag_df.index.get_level_values('hashtag').unique():

                    word_df = time_df[time_df['hashtag_str'].str.contains(tag, case=False)]
                    if len(word_df) == 0:
                        hashtag_df.at[(year, tag), 'month_{}'.format(month)] = ',,,;'
                    else:
                    #print (len(phrase_df))
                        hashtag_df.at[(year, tag), 'month_{}'.format(month)] = (str(len(word_df)) + ',' +
                         str(word_df.sentiment.mean()) + ',' + 
                         str(word_df.retweet_count.sum()) + ',' + 
                         str(word_df.favorited_count.sum()) + ';')


                    ctr += 1
                    sys.stdout.write('\r {} {} {} {} {}'.format(ctr, len(word_df), year, month, ctr / (len(hashtag_df) * 12)))
            except KeyError:
                    pass

    hashtag_df = hashtag_df.fillna(',,,;')
    hashtag_df.replace('nan', '0', inplace=True)

    flattened_hashtag_df = pd.DataFrame()

    for name in hashtag_df.index.get_level_values('hashtag').unique():
        name_df = hashtag_df.xs(name, level=1)
        for year, row in zip(range(2009, max_year + 1), name_df.get_values()):
            flattened_hashtag_df.loc[name, year] = ''.join(e for e in row)
        sys.stdout.write('\r {}'.format(len(flattened_hashtag_df) / 
                                        len(hashtag_df.index.get_level_values('hashtag').unique())))

    flattened_hashtag_df.index = flattened_hashtag_df.index.rename('tag')

    flattened_hashtag_df.to_csv('hashtag_df_flattened.csv')
    print ('hashtags all done')
            
    
    
    


def update_hashtags_month(tweets_df=tweets_df, current_df = current_df):            
    hashtag_df = pd.DataFrame(columns = ['day', 'tag', 'sentiment', 'retweets', 'likes'])
    ctr = 0
    for day in current_df.day.unique():
        series = current_df.groupby('day').get_group(day)['hashtags']
        feelings = current_df.groupby('day').get_group(day)['sentiment']
        retweets = current_df.groupby('day').get_group(day)['retweet_count']
        likes =  current_df.groupby('day').get_group(day)['favorited_count']
        for lst, sentiment, retweet, like in zip(series, feelings, retweets, likes):
            if not isinstance(lst, list):
                pass
            else:
                for hashtag in lst:
                    hashtag_df.loc[ctr, 'day'] = day
                    hashtag_df.loc[ctr, 'tag'] = hashtag
                    hashtag_df.loc[ctr, 'sentiment'] = pd.Series(sentiment).mean()
                    hashtag_df.loc[ctr, 'retweets'] = pd.Series(retweet).sum()
                    hashtag_df.loc[ctr, 'likes'] = pd.Series(like).sum()
                    ctr += 1
        if len(hashtag_df[hashtag_df['day'] == day]) == 0:
            hashtag_df.loc[ctr, 'day'] = day
            hashtag_df.loc[ctr, 'tag'] = None
            ctr += 1
            print (day)
    hashtag_df.to_csv('hashtag_df.csv')
    print ('hashtags month done')


if __name__ == '__main__':
    update_mentions_all()
    update_mentions_month()
    update_hashtags_all()
    update_hashtags_month()
        

