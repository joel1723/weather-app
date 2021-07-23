let citySearch;
const APIkey = '&appid=28870b55a52a06273a2463ffab2469f7';
const weatherAPI = 'https://api.openweathermap.org/data/2.5/weather?';
const uviAPI = 'https://api.openweathermap.org/data/2.5/uvi?lat=';
const forecastAPI = 'https://api.openweathermap.org/data/2.5/forecast?q=';
let geoAPI = navigator.geolocation;
let units = '&units=imperial';
let getWeatherIcon = 'http://openweathermap.org/img/wn/';
let searchHistoryArr = [];

$(document).ready(function() {
  init();

  function init() {
    search();
    $('#current-forecast').hide();
    $('#five-day-forecast-container').hide();
    $('#search-history-container').hide();
    $('#current-location-weather').hide();
    $('#error-div').hide();
    displayHistory();
    clearHistory();
    clickHistory();
    currentLocationButton();
  }

  function search() {
    $('#search-button').on('click', function() {
      citySearch = $('#search-input')
        .val()
        .trim();

      if (citySearch === '') {
        return;
      }
      $('#search-input').val('');
      getWeather(citySearch);
    });
  }

  function getWeather(search) {
    let queryURL = weatherAPI + 'q=' + search + units + APIkey;

    $.ajax({
      url: queryURL,
      method: 'GET',
      statusCode: {
        404: function() {
          $('#current-forecast').hide();
          $('#five-day-forecast-container').hide();
          $('#error-div').show();
        }
      }
    }).then(function(response) {
      $('#error-div').hide();
      $('#current-forecast').show();
      $('#five-day-forecast-container').show();

      let results = response;
        let name = results.name;
      let temperature = Math.floor(results.main.temp);
      let humidity = results.main.humidity;
    let windSpeed = results.wind.speed;
      let date = new Date(results.dt * 1000).toLocaleDateString('en-US');
      let weatherIcon = results.weather[0].icon;
      let weatherIconURL = getWeatherIcon + weatherIcon + '.png';

      storeHistory(name);

      $('#city-name').text(name + ' (' + date + ') ');
      $('#weather-image').attr('src', weatherIconURL);
      $('#temperature').html(`<b>Temperature: </b> ${temperature}  °F`);
      $('#humidity').html(`<b>Humidity: </b> ${humidity} %`);
      $('#wind-speed').html(`<b>Wind Speed: </b>' ${windSpeed}  MPH`);

      let lat = response.coord.lat;
      let lon = response.coord.lon;
      let uviQueryURL = uviAPI + lat + '&lon=' + lon + APIkey;

      $.ajax({
        url: uviQueryURL,
        method: 'GET'
      }).then(function(uviResponse) {
        let uviResults = uviResponse;
        let uvi = uviResults.value;
        $('#uv-index').html(
          '<b>UV Index: </b>' +
            '<span class="badge badge-pill badge-light" id="uvi-badge">' +
            uvi +
            '</span>'
        );

        // DRY this out...
        if (uvi < 3) {
          $('#uvi-badge').css('background-color', 'green');
        } else if (uvi < 6) {
          $('#uvi-badge').css('background-color', 'yellow');
        } else if (uvi < 8) {
          $('#uvi-badge').css('background-color', 'orange');
        } else if (uvi < 11) {
          $('#uvi-badge').css('background-color', 'red');
        } else {
          $('#uvi-badge').css('background-color', 'purple');
        }
      });

      let cityName = name;
      let countryCode = response.sys.country;
      let forecastQueryURL =
        forecastAPI + cityName + ',' + countryCode + units + APIkey;

      $.ajax({
        url: forecastQueryURL,
        method: 'GET'
      }).then(function(forecastResponse) {
        var forecastResults = forecastResponse;
        var forecastArr = [];

        for (var i = 5; i < 40; i += 8) {
          let forecastObj = {};
          let forecastResultsDate = forecastResults.list[i].dt_txt;
          let forecastDate = new Date(forecastResultsDate).toLocaleDateString(
            'en-US'
          );
          let forecastTemp = forecastResults.list[i].main.temp;
          let forecastHumidity = forecastResults.list[i].main.humidity;
          let forecastIcon = forecastResults.list[i].weather[0].icon;

          forecastObj['list'] = {};
          forecastObj['list']['date'] = forecastDate;
          forecastObj['list']['temp'] = forecastTemp;
          forecastObj['list']['humidity'] = forecastHumidity;
          forecastObj['list']['icon'] = forecastIcon;

          forecastArr.push(forecastObj);
        }

        for (var j = 0; j < 5; j++) {
          var forecastArrDate = forecastArr[j].list.date;
          var forecastIconURL =
            getWeatherIcon + forecastArr[j].list.icon + '.png';
          var forecastArrTemp = Math.floor(forecastArr[j].list.temp);
          var forecastArrHumidity = forecastArr[j].list.humidity;

          $('#date-' + (j + 1)).text(forecastArrDate);
          $('#weather-image-' + (j + 1)).attr('src', forecastIconURL);
          $('#temp-' + (j + 1)).text(
            'Temp: ' + Math.floor(forecastArrTemp) + ' °F'
          );
          $('#humidity-' + (j + 1)).text(
            'Humidity: ' + forecastArrHumidity + '%'
          );
        }
        $('#weather-container').show();
      });
    });
  }

  function getCurrentLocation() {
    function success(position) {
      const currentLat = position.coords.latitude;
      const currentLon = position.coords.longitude;
      var currentLocationQueryURL =
        weatherAPI +
        'lat=' +
        currentLat +
        '&lon=' +
        currentLon +
        units +
        APIkey;

      $.ajax({
        url: currentLocationQueryURL,
        method: 'GET'
      }).then(function(currentLocationResponse) {
        var currentLocationResults = currentLocationResponse;
        var currentLocationName = currentLocationResults.name;
        var currentLocationTemp = currentLocationResults.main.temp;
        var currentLocationHumidity = currentLocationResults.main.humidity;
        var currentLocationIcon = currentLocationResults.weather[0].icon;
        var currentLocationIconURL =
          getWeatherIcon + currentLocationIcon + '.png';

        $('#current-location').text(currentLocationName);
        $('#weather-image-current-location').attr(
          'src',
          currentLocationIconURL
        );
        $('#temp-current-location').html(
          '<b>Temperature: </b>' + currentLocationTemp + ' °F'
        );
        $('#humidity-current-location').html(
          '<b>Humidity: </b>' + currentLocationHumidity + '%'
        );
      });

      $('#current-location-weather').show();
    }

    function error() {
      $('#current-location').text('Cannot get your current location.');
    }

    if (!geoAPI) {
      $('#current-location').text(
        'Geolocation is not supported by your browser'
      );
    } else {
      geoAPI.getCurrentPosition(success, error);
    }
  }

  function currentLocationButton() {
    $('#current-location-button').on('click', function() {
      getCurrentLocation();
    });
  }

  function storeHistory(citySearchName) {
    var searchHistoryObj = {};

    if (searchHistoryArr.length === 0) {
      searchHistoryObj['city'] = citySearchName;
      searchHistoryArr.push(searchHistoryObj);
      localStorage.setItem('searchHistory', JSON.stringify(searchHistoryArr));
    } else {
      var checkHistory = searchHistoryArr.find(
        ({ city }) => city === citySearchName
      );

      if (searchHistoryArr.length < 5) {
        if (checkHistory === undefined) {
          searchHistoryObj['city'] = citySearchName;
          searchHistoryArr.push(searchHistoryObj);
          localStorage.setItem(
            'searchHistory',
            JSON.stringify(searchHistoryArr)
          );
        }
      } else {
        if (checkHistory === undefined) {
          searchHistoryArr.shift();
          searchHistoryObj['city'] = citySearchName;
          searchHistoryArr.push(searchHistoryObj);
          localStorage.setItem(
            'searchHistory',
            JSON.stringify(searchHistoryArr)
          );
        }
      }
    }
    $('#search-history').empty();
    displayHistory();
  }

  function displayHistory() {
    var getLocalSearchHistory = localStorage.getItem('searchHistory');
    var localSearchHistory = JSON.parse(getLocalSearchHistory);

    if (getLocalSearchHistory === null) {
      createHistory();
      getLocalSearchHistory = localStorage.getItem('searchHistory');
      localSearchHistory = JSON.parse(getLocalSearchHistory);
    }

    for (var i = 0; i < localSearchHistory.length; i++) {
      var historyLi = $('<li>');
      historyLi.addClass('list-group-item');
      historyLi.text(localSearchHistory[i].city);
      $('#search-history').prepend(historyLi);
      $('#search-history-container').show();
    }
    return (searchHistoryArr = localSearchHistory);
  }

  function createHistory() {
    searchHistoryArr.length = 0;
    localStorage.setItem('searchHistory', JSON.stringify(searchHistoryArr));
  }

  function clearHistory() {
    $('#clear-button').on('click', function() {
      $('#search-history').empty();
      $('#search-history-container').hide();
      localStorage.removeItem('searchHistory');
      createHistory();
    });
  }

  function clickHistory() {
    $('#search-history').on('click', 'li', function() {
      var cityNameHistory = $(this).text();
      getWeather(cityNameHistory);
    });
  }
});