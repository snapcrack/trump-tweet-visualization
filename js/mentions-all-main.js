function initMentionsAll (container) {
    let rootContainer = document.getElementById(container);

    let searchInput = rootContainer.querySelector('.search-input'),
        chart = document.getElementById(container + '_chart');

    let data = null;
    
    d3.csv('https://dl.dropboxusercontent.com/s/evcn5bxcuxnxwdg/mention_df_flattened.csv?dl=1')
     .then(response => {
        data = response;
        chart.innerHTML = ''

        // search('HISTORY');
        
        let options = data
            .map(x => x.tag)
            .filter((x, i, arr) => arr.indexOf(x) === i);
        
        autoComplete(options);
    })
    .catch((e) => {
        console.error(e)
        return alert("Something went wrong!");
    });

    var scatter = Scatterplot()
        .container('#' + container + '_chart')
        .svgWidth(chart.getBoundingClientRect().width - 30)
        .svgHeight(500);
    
    function addTotals (data) {
        let totalCount, totalRetweets, minRetweets, maxRetweets;

        totalCount = d3.sum(data, d => +d.count);
        totalRetweets = d3.sum(data, d => +d.retweets);
        minRetweets = d3.min(data, d => d.retweets);
        maxRetweets = d3.max(data, d => d.retweets);

        rootContainer.querySelector('.total-count').innerHTML = totalCount;
        rootContainer.querySelector('.legend-cicle-label-min').innerHTML = minRetweets;
        rootContainer.querySelector('.legend-cicle-label-max').innerHTML = maxRetweets;
        rootContainer.querySelector('.total-retweets').innerHTML = totalRetweets.toFixed(2);
        rootContainer.querySelector('.totals').style.display = 'initial';
        rootContainer.querySelector('.legend-container').style.display = 'initial';

        if (data.length == 1) {
            rootContainer.querySelector('.legend-cicle-label-min').style.display = 'none';
            rootContainer.querySelector('.legend-circle2').style.display = 'none';
        } else {
            rootContainer.querySelector('.legend-cicle-label-min').style.display = 'block';
            rootContainer.querySelector('.legend-circle2').style.display = 'block';
        }
    }

    function autoComplete (options) {
        new Awesomplete(searchInput, {
            minChars: 2,
            autoFirst: true,
            list: options
        });
    }

    function initChart (data) {
        scatter.data(data)
            .render();
    }

    function search (keyword) {
        if (!data) return;

        searchInput.value = keyword;

        let ngrams = data.filter(x => x.tag === keyword);

        if (ngrams.length) {
            let unflattened = unflatten_2(ngrams[0]);
            addTotals(unflattened);
            initChart(unflattened);
        }
    }

    function handleEnter (e) {
        if (e.keyCode === 13) {
            if (e.target.value != '') {
                search(e.target.value);
            }
        }
    }

    window['chart_' + container] = scatter;
    
    searchInput.addEventListener('keydown', handleEnter);
    searchInput.addEventListener('awesomplete-selectcomplete', obj => search(obj.text.value)) 
}