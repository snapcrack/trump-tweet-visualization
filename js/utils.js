function unflatten (data) {
  let dt = [];
  let splitConfig = {
    0: 'count',
    1: 'sentiment',
    2: 'retweets',
    3: 'favorites'
  }
  data.forEach(d => {
    for (let i = 1; i <= 12; i++) {
      let month = d['month_' + i];
      let split = month.split(',');
      if (split[0] != '') {
        let obj = {
          year: +d.year,
          ngram: d.tag,
          month: i
        };
        split.forEach((s, i) => {
          if (s[i] != '') {
            obj[splitConfig[i]] = +s
          }
        })
        dt.push(obj)
      }
    }
  })
  return dt;
}

function unflatten_2 (input) {
  let dt = [];
  let splitConfig = {
    0: 'count',
    1: 'sentiment',
    2: 'retweets',
    3: 'favorites'
  }
  let years = Object.keys(input).filter(x => x !== 'tag')
  
  years.forEach(year => {
    let mentionValue = input[year]
    let months = mentionValue.split(';')
    months.forEach((month, i) => {
      let values = month.split(',');
      if (values[0] != '') {
        let obj = {
          year: year,
          ngram: input.tag,
          month: i + 1
        }
        values.forEach((value, i) => {
          if (value != '') {
            obj[splitConfig[i]] = +value
          }
        });
        dt.push(obj);
      }
    })
  })
  
  return dt;
}