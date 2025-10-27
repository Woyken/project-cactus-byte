var lang = [];
var gps_position;

var map;
var markers = [];
var marker = [];
var infowindow = [];
var contentString = [];

function load() {
	navigator.geolocation.getCurrentPosition(getLocation, error_callback, {maximumAge:60000, timeout:5000, enableHighAccuracy:false});
	windowResize();
}
function error_callback() {}
function getLocation(position)
{
	gps_position = position;

	if(filter_course_close_to_me)
	{
		showCompetitions3();

		setCountryList();
		setClubList();
		setCourseList();
		setTypeList();
		setMyList();

		setAreaList();

		ChangeUrl();
	}

}

var previous_width = 0;
function windowResize()
{
	var witdh = $(window).width();

	//if(witdh < 800 && previous_width != witdh || filter_special=='association' || filter_special=='my')
	//{
	//	if(document.getElementById('id_more_filter'))
	//		document.getElementById('id_more_filter').style.display  = 'none';

	//	document.getElementById('id_button_more').value  = '▼';
	//	previous_width = witdh;
	//}
	//else if(witdh >= 800)
	//{
	//	if(document.getElementById('id_more_filter'))
	//		document.getElementById('id_more_filter').style.display  = 'block';
		//document.getElementById('id_datefilter_horisontal').style.display  = 'block';
	//	document.getElementById('id_button_more').value  = '▲';
	//}

}

function saveClickLog(){}

// show more filter elements
function showMore()
{
	if(document.getElementById('id_more_filter').style.display  == 'none')
	{
		document.getElementById('id_more_filter').style.display  = 'block';
		//document.getElementById('id_datefilter_horisontal').style.display  = 'block';
		document.getElementById('id_button_more').value  = '▲';
	}
	else
	{
		document.getElementById('id_more_filter').style.display  = 'none';
		//document.getElementById('id_datefilter_horisontal').style.display  = 'none';
		document.getElementById('id_button_more').value  = '▼';
	}
}

var weekdays = [];
var months = [];

var filter_special = '';  // values: all (if empty then all), my, asscociation
var filter_association_id = 0;
var filter_association_name = '';

var filter_set_name = '';
var filter_set_id = 0;
var filter_name = '';
var filter_period = '';
var filter_period_duration = 0;
var filter_date1 = '';
var filter_date2 = '';
var filter_registration_open = '';
var filter_registration_will_open = '';
var filter_registration_date1 = '';
var filter_registration_date2 = '';
var filter_country_code = '';
var filter_country_name = '';
var filter_my_country = 0;
var filter_my_country_code = '';
var filter_my_club = '';
var filter_club_type = '';
var filter_club_id = '';
var filter_club_name = '';
var filter_course_id = '';
var filter_course_name = '';
var filter_course_close_to_me = '';
var filter_course_area = '';
var filter_course_city = '';
var filter_my = '';
var filter_my_name = '';
var filter_my_all = '';
var filter_type = '';
var filter_type_name = '';
var filter_division = '';
var filter_division_name = '';

var filter_view = '';
var filter_sort_name = ''; // list view only
var filter_sort_order = ''; // list view only

var filter_country_array = [];
var filter_club_array = [];
var filter_course_array = [];
var filter_type_array = [];
var filter_division_array = [];
var filter_my_array = [];

var list_from = 1;
var list_to = 20;
var list_page_count = 20;

// new filter
function showCompetitions3()
{
	var filter = '';

	filter = "name="+filter_name;

	if(filter_view)
	{
		if(filter)
			filter = filter + '&';
		filter=filter+"view="+filter_view;
	}

	// dates filters
	if(filter)
		filter=filter+"&date1="+filter_date1;
	else
		filter="&date1="+filter_date1;
	if(filter)
		filter=filter+"&date2="+filter_date2;
	else
		filter="&date2="+filter_date2;

	if(filter_registration_open)
	{
		if(filter)
			filter = filter + '&';
		filter=filter+"registration_open="+filter_registration_open;
	}

	if(filter_registration_will_open)
	{
		if(filter)
			filter = filter + '&';
		filter=filter+"registration_will_open="+filter_registration_will_open;
	}

	// dates filters
	if(filter)
		filter=filter+"&registration_date1="+filter_registration_date1;
	else
		filter="&registration_date1="+filter_registration_date1;
	if(filter)
		filter=filter+"&registration_date2="+filter_registration_date2;
	else
		filter="&registration_date2="+filter_registration_date2;

	if(filter_country_code)
	{
		if(filter)
			filter = filter + '&';
		filter=filter+"country_code="+filter_country_code;
	}

	if(filter_club_id)
	{
		if(filter)
			filter = filter + '&';
		filter=filter+"clubid="+filter_club_id+"&clubtype="+filter_club_type;
	}

	if(filter_association_id)
	{
		if(filter)
			filter = filter + '&';
		filter=filter+"association_id="+filter_association_id;
	}

	if(filter_course_id)
	{
		if(filter)
			filter = filter + '&';
		filter=filter+"course_id="+filter_course_id;
	}

	if(filter_course_close_to_me)
	{
		if(filter)
			filter = filter + '&';
		filter=filter+"close_to_me="+filter_course_close_to_me;

		var lat = '';
		var lng = '';
		if(gps_position)
		{
			lat = gps_position.coords.latitude;
			lng = gps_position.coords.longitude;
			filter=filter+"&lat="+lat;
			filter=filter+"&lng="+lng;

		}
	}

	if(filter_course_area)
	{
		if(filter)
			filter = filter + '&';
		filter = filter + "area=" + filter_course_area;
	}

	if(filter_course_city)
	{
		if(filter)
			filter = filter + '&';
		filter = filter + "city=" + filter_course_city;
	}

	if(filter_division_name)
	{
		if(filter)
			filter = filter + '&';
		filter=filter+"division=" + encodeURIComponent(filter_division_name);
	}

	if(filter_my)
	{
		if(filter)
			filter = filter + '&';
		filter=filter+"my="+filter_my;
	}

	if(filter_my_all)
	{
		if(filter)
			filter = filter + '&';
		filter=filter+"my_all="+filter_my_all;
	}

	if(filter_type)
	{
		if(filter)
			filter = filter + '&';
		filter=filter+"type="+filter_type;
	}

	if(filter_view)
	{
		if(filter)
			filter = filter + '&';
		filter=filter+"view="+filter_view;
	}

	if(filter_sort_name)
	{
		if(filter)
			filter = filter + '&';
		filter=filter+"sort_name="+filter_sort_name;
	}

	if(filter_sort_order)
	{
		if(filter)
			filter = filter + '&';
		filter=filter+"sort_order="+filter_sort_order;
	}

	filter=filter+"&from="+list_from+"&to="+list_to;

	filter=filter+"&page="+filter_special;

	var xmlhttp;
	if (window.XMLHttpRequest)
	{   // code for IE7+, Firefox, Chrome, Opera, Safari
		xmlhttp=new XMLHttpRequest();
	}

	if(filter_view == 3) // set the map and fill the data
	{

		xmlhttp.onreadystatechange=function()
		{
			if (xmlhttp.readyState==4 && xmlhttp.status==200)
			{
				markers = JSON.parse(xmlhttp.responseText, false);

				if(!map)
				{
					if(markers.length>0)
						map = L.map('map-canvas').setView([markers[0][2], markers[0][3]], 6);
					else
						map = L.map('map-canvas').setView(30, 0, 2);
					map.addControl(new L.Control.Fullscreen());

					// token from https://www.mapbox.com
					var token = "pk.eyJ1IjoibWFya29zYXZpYXVrIiwiYSI6ImNrZ2VzYnkxZDBnMHcyc2tmZ3N6MDM3bmEifQ.0pIAOH4V-_3Klg4eJw9A3w";

					L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token='+token, {
						attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
						maxZoom: 18,
						id: 'mapbox.satellite',
						accessToken: token
					}).addTo(map);

				}

				for(var i=0; i<marker.length; i++)
				{
					map.removeLayer(marker[i]);
				}


				if(markers.length>0) {


					for(var i=0; i < markers.length; i++)
					{

						var contentString = '<div id="content">'+
						'<div id="siteNotice">'+
						'</div>'+
						'<h1 id="firstHeading" class="firstHeading"><a href="/'+markers[i][0]+'">'+markers[i][1]+'</a></h1>'+
						'<div id="bodyContent">'+
						'<p>Date/time: <b>'+markers[i][4]+' '+markers[i][5]+'</b> Location: '+markers[i][7]+'</p>';

						if(markers[i][8]) // comment
						{
							contentString = contentString + '<p>'+markers[i][8]+'</p>';
						}
						contentString = contentString + '<p><a href="/'+markers[i][0]+'">Click here for more info</a></p>'+
						'</div>'+
						'</div>';

						marker[i]= L.marker([markers[i][2], markers[i][3]]).addTo(map);

						marker[i].bindPopup(contentString);
						marker[i].on('click', function(e) {
							this.openPopup();
						});

					}
				}

			}
		}

		xmlhttp.open("GET","competitions_map_server.php?"+filter,true);
		xmlhttp.send();
	}
	else
	{

		xmlhttp.onreadystatechange=function()
		{
			if (xmlhttp.readyState==4 && xmlhttp.status==200)
			{

				doc = document.getElementById("competition_list2");
				doc.innerHTML = xmlhttp.responseText;

				for(a=1;a<=5;a++)
				{
					var td_=document.getElementById("td"+a+"_");
					var td = document.getElementById("td"+a);
					if(td)
						if(td_)
							td_.width=td.offsetWidth-5;
				}

			}
		}

		if(filter_view == 1 || !filter_view)
			xmlhttp.open("GET","competitions_server.php?"+filter,true);
		else if(filter_view == 2)
			xmlhttp.open("GET","competitions_list_server.php?"+filter,true);
		xmlhttp.send();
	}
}

function setFreetext()
{
	if(document.getElementById("id_filter_set_name"))
	{
		document.getElementById("id_filter_set_name").innerHTML = lang['custom'];
	}

	filter_set_id = 0;

	var t = document.getElementById("id_filter_name");

	filter_name = t.value;

	list_from = 1;
	list_to = list_page_count;


	var names = filter_name.split(" ");
	var name_short = 0;
	for(var i = 0; i<names.length; i++)
	{
		if(names[i].length>0 && names[i].length<2)
			name_short = 1;
	}
	if(name_short)
	{
		alert(lang['warning_short_word']);
	}
	if(filter_date1 && filter_date2)
	{
		var r = confirm("The date filter is set "+filter_date1+" - "+filter_date2+". Is it correct (otherwize no use the date filter)?");

		if(r == false)
		{
			filter_date1 = '';
			filter_date2 = '';

			setFilters();
		}
	}

	filter_sort_name = 'date';
	filter_sort_order = 'desc';

	showCompetitions3();

	setCountryList();
	setClubList();
	setMyList();
	setTypeList();

	ChangeUrl();

}

function setFilters()
{
	// dates
	var curr = new Date;
	var d = new Date();
	var d1 = new Date(filter_date1);
	var d2 = new Date(filter_date2);

	var is_selected = true;

	// set all empty
	document.getElementById("id_today").innerHTML = lang['today'];
	document.getElementById("id_currentweek").innerHTML = lang['current_week'];
	document.getElementById("id_currentmonth").innerHTML = lang['current_month'];
	document.getElementById("id_currentyear").innerHTML = lang['current_year'];


	if(filter_date1)
	{
		if(document.getElementById('id_datefilter_horisontal'))
			document.getElementById('id_datefilter_horisontal').style.display  = 'block';
	}
	else
	{
		if(document.getElementById('id_datefilter_horisontal'))
			document.getElementById('id_datefilter_horisontal').style.display  = 'none';
	}


	if(filter_name)
	{
		if(document.getElementById("id_filter_name"))
			document.getElementById("id_filter_name").value = filter_name;
	}

	if(filter_date1 && filter_date2)
	{
		if(filter_date1 == filter_date2)
		{
			document.getElementById("id_filter_date").innerHTML = d1.toLocaleDateString();

			document.getElementById("id_show_date1").value = filter_date1;
			document.getElementById("id_show_date2").value = filter_date2;

			// is today?
			d.setDate(curr.getDate());
			if(filter_date1 == d.toISOString().slice(0,10))
			{
				filter_period = 'today';
				document.getElementById("id_today").innerHTML = lang['today']+'<i class="fi-check"></i>';
			}

		}
		else
		{
			document.getElementById("id_filter_date").innerHTML = d1.toLocaleDateString()+" - "+d2.toLocaleDateString();
			document.getElementById("id_show_date1").value = filter_date1;
			document.getElementById("id_show_date2").value = filter_date2;

			// is current week?
			d.setDate(curr.getDate() - curr.getDay() + 1);
			if(filter_date1 == d.toISOString().slice(0,10))
			{

				d.setDate(d.getDate() + 6);
				if(filter_date2 == d.toISOString().slice(0,10))
				{
					filter_period = 'currentweek';
					document.getElementById("id_currentweek").innerHTML = lang['current_week']+'<i class="fi-check"></i>';
				}
			}
			// is current month?
			d = new Date(curr.getFullYear(), curr.getMonth(), 2);
			if(filter_date1 == d.toISOString().slice(0,10))
			{
				d = new Date(curr.getFullYear(), curr.getMonth() + 1, 1);
				if(filter_date2 == d.toISOString().slice(0,10))
				{
					filter_period = 'currentmonth';
					document.getElementById("id_currentmonth").innerHTML = lang['current_month']+'<i class="fi-check"></i>';
				}
			}
			// is current year?
			d = new Date(curr.getFullYear(), 0, 2);
			if(filter_date1 == d.toISOString().slice(0,10))
			{
				d = new Date(curr.getFullYear() + 1, 0, 1);
				if(filter_date2 == d.toISOString().slice(0,10))
				{
					filter_period = 'currentyear';
					document.getElementById("id_currentyear").innerHTML = lang['current_year']+'<i class="fi-check"></i>';
				}
			}

		}

	}
	else
	{
		if(filter_date1 && !filter_date2)
		{
			if(filter_period != 'next')
			{
				filter_period = '';
				document.getElementById("id_filter_date").innerHTML = d1.toLocaleDateString()+" - ...";
				document.getElementById("id_show_date1").value = filter_date1;
				document.getElementById("id_show_date2").value = '';
			}
			else
			{
				document.getElementById("id_show_date1").value = filter_date1;
				document.getElementById("id_show_date2").value = '';
			}
		}
		else if(!filter_date1 && filter_date2)
		{
			if(filter_period != 'prev')
			{
				filter_period = '';
				document.getElementById("id_filter_date").innerHTML = "... - " + d2.toLocaleDateString();
				document.getElementById("id_show_date1").value = '';
				document.getElementById("id_show_date2").value = filter_date2;
			}
			else
			{
				document.getElementById("id_show_date1").value = '';
				document.getElementById("id_show_date2").value = filter_date2;
			}
		}
		else
		{
			filter_period = '';
			document.getElementById("id_filter_date").innerHTML = lang['date'];

			is_selected = false;
		}

	}

	// set horizontal date menu
	if(document.getElementById("id_datefilter_horisontal"))
	{

		var c = '';
		var d1 = new Date(filter_date1);
		var d2 = new Date(filter_date2);

		var d = new Date();

		for(var i=-6; i<=6; i++)
		{
			var d1 = new Date(filter_date1);
			d1.setDate(d1.getDate()+i);


			class_ = '';
			if(i==0)
				class_ = 'today';

			u = d1.getDay(); // 0-6

			if(u==6 || u==0)
				class_ += ' weekend';
			if(i<-2 || i>2)
				class_ += ' hide-for-small-only';

			c =  '<a onclick="setFilterDateMove('+i+'); return false;">';
			c +=  '<span class="month">'+months[d1.getMonth()]+'</span>'; // Mar
			c +=  '<span class="date">'+d1.getDate()+'</span>'; // 31
			c +=  '<span class="day">'+weekdays[u]+'</span>'; // mon
			c +=  '</a>';

			document.getElementById("id_hori_"+i).innerHTML = c;
			document.getElementById("id_hori_"+i).className = class_;
		}

	}

	// set one click filter buttons
	if(document.getElementById("id_button_past"))
		document.getElementById("id_button_past").classList.remove("is-active");
	if(document.getElementById("id_button_future"))
		document.getElementById("id_button_future").classList.remove("is-active");
	if(document.getElementById("id_button_registration_open"))
		document.getElementById("id_button_registration_open").classList.remove("is-active");
	if(document.getElementById("id_button_registration_will_open"))
		document.getElementById("id_button_registration_will_open").classList.remove("is-active");
	if(filter_period == 'next' && document.getElementById("id_button_future"))
		document.getElementById("id_button_future").classList.add("is-active");
	if(filter_period == 'prev' && document.getElementById("id_button_past"))
		document.getElementById("id_button_past").classList.add("is-active");
	if(filter_registration_open && document.getElementById("id_button_registration_open"))
		document.getElementById("id_button_registration_open").classList.add("is-active");
	if(filter_registration_will_open && document.getElementById("id_button_registration_will_open"))
		document.getElementById("id_button_registration_will_open").classList.add("is-active");

	if(filter_period != 'next')
	{
		document.getElementById("id_next").value='';
	}
	else
	{
		document.getElementById("id_next").value = filter_period_duration;
	}
	if(filter_period != 'prev')
	{
		document.getElementById("id_prev").value='';
	}
	else
	{
		document.getElementById("id_prev").value = filter_period_duration;
	}

	if(filter_period == 'today')
		document.getElementById("id_filter_date").innerHTML = lang['today'];
	else if(filter_period == 'yesterday')
		document.getElementById("id_filter_date").innerHTML = lang['yesterday'];
	else if(filter_period == 'currentweek')
		document.getElementById("id_filter_date").innerHTML = lang['current_week'];
	else if(filter_period == 'currentmonth')
		document.getElementById("id_filter_date").innerHTML = lang['current_month'];
	else if(filter_period == 'currentyear')
		document.getElementById("id_filter_date").innerHTML = lang['current_year'];
	else if(filter_period == 'next')
	{
		if(filter_period_duration == 'future')
			document.getElementById("id_filter_date").innerHTML = lang['future'];
		else
			document.getElementById("id_filter_date").innerHTML = lang['next']+' '+filter_period_duration+' '+lang['days'];
	}
	else if(filter_period == 'prev')
	{
		if(filter_period_duration == 'past')
			document.getElementById("id_filter_date").innerHTML = lang['past'];
		else
			document.getElementById("id_filter_date").innerHTML = lang['previous']+' '+filter_period_duration+' '+lang['days'];
	}


	if(is_selected)
	{
		if ( !document.getElementById("id_filter_date").classList.contains('is-selected'))
		{
			document.getElementById("id_filter_date").classList.add('is-selected');
		}
	}
	else
	{
		if (document.getElementById("id_filter_date").classList.contains('is-selected'))
		{
			document.getElementById("id_filter_date").classList.remove('is-selected');
		}
	}

	// set registration
	var r1 = new Date(filter_registration_date1);
	var r2 = new Date(filter_registration_date2);
    if(document.getElementById("id_registration_open"))
        document.getElementById("id_registration_open").innerHTML = lang['open'];
    if(document.getElementById("id_registration_will_open"))
        document.getElementById("id_registration_will_open").innerHTML = lang['will_open'];
	if(filter_registration_open)
	{
		document.getElementById("id_filter_registration").innerHTML = lang['open'];
		if ( !document.getElementById("id_filter_registration").classList.contains('is-selected'))
		{
			document.getElementById("id_filter_registration").classList.add('is-selected');
		}

		document.getElementById("id_registration_open").innerHTML = lang['open'] + '<i class="fi-check"></i>';
		document.getElementById("id_registration_date1").value = '';
		document.getElementById("id_registration_date2").value = '';

		if(document.getElementById("id_filter_registration_open"))
			document.getElementById("id_filter_registration_open").checked = true;

	}
	else if(filter_registration_will_open)
	{
		document.getElementById("id_filter_registration").innerHTML = lang['will_open'];
		if ( !document.getElementById("id_filter_registration").classList.contains('is-selected'))
		{
			document.getElementById("id_filter_registration").classList.add('is-selected');
		}
		document.getElementById("id_registration_will_open").innerHTML = lang['will_open'] + '<i class="fi-check"></i>';
		document.getElementById("id_registration_date1").value = '';
		document.getElementById("id_registration_date2").value = '';

		if(document.getElementById("id_filter_registration_open"))
			document.getElementById("id_filter_registration_open").checked = true;

	}
	else if(filter_registration_date1 && filter_registration_date2)
	{
		document.getElementById("id_filter_registration").innerHTML = lang['open'];
		if ( !document.getElementById("id_filter_registration").classList.contains('is-selected'))
		{
			document.getElementById("id_filter_registration").classList.add('is-selected');
		}

		if(filter_registration_date1 == filter_registration_date2)
		{
			document.getElementById("id_filter_registration").innerHTML = r1.toLocaleDateString();

			document.getElementById("id_registration_date1").value = filter_registration_date1;
			document.getElementById("id_registration_date2").value = filter_registration_date2;

		}
		else
		{
			document.getElementById("id_filter_registration").innerHTML = r1.toLocaleDateString()+" - "+r2.toLocaleDateString();
			document.getElementById("id_registration_date1").value = filter_registration_date1;
			document.getElementById("id_registration_date2").value = filter_registration_date2;
		}
		if(document.getElementById("id_filter_registration_open"))
			document.getElementById("id_filter_registration_open").checked = false;
	}
	else
	{
		document.getElementById("id_registration_date1").value = filter_registration_date1;
		document.getElementById("id_registration_date2").value = filter_registration_date2;

		if(filter_registration_date1 && !filter_registration_date2)
		{
			document.getElementById("id_filter_registration").innerHTML = lang['open'];
			if ( !document.getElementById("id_filter_registration").classList.contains('is-selected'))
			{
				document.getElementById("id_filter_registration").classList.add('is-selected');
			}

			document.getElementById("id_filter_registration").innerHTML = r1.toLocaleDateString()+" - ...";
		}
		else if(!filter_registration_date1 && filter_registration_date2)
		{
			document.getElementById("id_filter_registration").innerHTML = lang['open'];
			if ( !document.getElementById("id_filter_registration").classList.contains('is-selected'))
			{
				document.getElementById("id_filter_registration").classList.add('is-selected');
			}

			document.getElementById("id_filter_registration").innerHTML = "... - " + r2.toLocaleDateString();
		}
		else
		{
			document.getElementById("id_filter_registration").innerHTML = lang['registration'];
			if (document.getElementById("id_filter_registration").classList.contains('is-selected'))
			{
				document.getElementById("id_filter_registration").classList.remove('is-selected');
			}
		}

		if(document.getElementById("id_filter_registration_open"))
			document.getElementById("id_filter_registration_open").checked = false;
	}

	// set country
	if(filter_country_array)
	{

		for(var i=0; i<filter_country_array.length; i++)
		{

			var t = document.getElementById('id_country'+filter_country_array[i]['Code']);

			var p = 'id_country'+filter_country_array[i]['Code'];

			if(t)
			{
				t.innerHTML = filter_country_array[i]['Name']+' ('+filter_country_array[i]['Count']+')';

				if(filter_country_code == filter_country_array[i]['Code'])
				{
					t.innerHTML += '<i class="fi-check"></i>';
				}
			}

		}
	}
	if(filter_country_code)
	{
		if(filter_my_country == 1)
		{

			document.getElementById("id_filter_country").innerHTML = lang['my_country'];
			document.getElementById("id_my_country").innerHTML = lang['my_country']+ '<i class="fi-check"></i>';
		}
		else
		{
			document.getElementById("id_filter_country").innerHTML = filter_country_name;
			document.getElementById("id_my_country").innerHTML = lang['my_country'];
		}

		if ( !document.getElementById("id_filter_country").classList.contains('is-selected'))
		{
			document.getElementById("id_filter_country").classList.add('is-selected');
		}

	}
	else
	{
		if(filter_my_country == 1)
		{
			document.getElementById("id_filter_country").innerHTML = lang['my_country'];
			document.getElementById("id_my_country").innerHTML = lang['my_country']+ '<i class="fi-check"></i>';
			if ( !document.getElementById("id_filter_country").classList.contains('is-selected'))
			{
				document.getElementById("id_filter_country").classList.add('is-selected');
			}
		}
		else
		{
			document.getElementById("id_filter_country").innerHTML = lang['country'];
			if (document.getElementById("id_filter_country").classList.contains('is-selected'))
			{
				document.getElementById("id_filter_country").classList.remove('is-selected');
			}
			document.getElementById("id_my_country").innerHTML = lang['my_country'];
		}
	}

	// set club
	if(filter_club_array)
	{

		code = filter_club_id.split(",");
		for(var i=0; i<filter_club_array.length; i++)
		{
			var t = document.getElementById('id_'+filter_club_array[i]['Type']+'_'+filter_club_array[i]['ID']);
			if(t)
			{
				t.innerHTML = filter_club_array[i]['Name']+' ('+filter_club_array[i]['Count']+')';


				// it the club or association selected
				found = 0;
				for(j=0; j < code.length; j++)
				{
					if(filter_club_type == filter_club_array[i]['Type'] && code[j] == filter_club_array[i]['ID'])
					{
						t.innerHTML += '<i class="fi-check"></i>.';
						found = 1;
					}
				}
				if(found == 0)
				{
					if(1 == filter_club_array[i]['Type'] && 1 == filter_club_array[i]['ID'])
					{
						t.innerHTML += '<i class="fi-check"></i>.';
					}
				}
			}

		}
	}

	if(filter_special == 'association')
	{
		document.getElementById("id_my_club").style.display = 'none';
	}

	if(filter_club_id)
	{
		if(filter_my_club)
		{
			document.getElementById("id_my_club").innerHTML = lang['my_club']+ '<i class="fi-check"></i>';
		}
		else
		{
			document.getElementById("id_my_club").innerHTML = lang['my_club'];
		}

		code = filter_club_id.split(",");
		if(filter_my_club)
		{
			document.getElementById("id_filter_club").innerHTML = lang['my_club'];
		}
		else
		{
			if(code.length == 1)
				document.getElementById("id_filter_club").innerHTML = filter_club_name;
			else
				document.getElementById("id_filter_club").innerHTML = lang['several_clubs'];
		}
		if ( !document.getElementById("id_filter_club").classList.contains('is-selected'))
		{
			document.getElementById("id_filter_club").classList.add('is-selected');
		}

	}
	else
	{
		document.getElementById("id_filter_club").innerHTML = lang['club'];
		if (document.getElementById("id_filter_club").classList.contains('is-selected'))
		{
			document.getElementById("id_filter_club").classList.remove('is-selected');
		}
		document.getElementById("id_my_club").innerHTML = lang['my_club'];
	}


	// set course
	if(filter_course_array)
	{
		for(var i=0; i<filter_course_array.length; i++)
		{
			var t = document.getElementById('id_course'+filter_course_array[i]['ID']);
			if(t)
			{

				t.innerHTML = filter_course_array[i]['Name']+' <span class="list-item-count">'+filter_course_array[i]['Count']+'</span>';
				if(filter_course_id == filter_course_array[i]['ID'])
				{
					t.innerHTML += '<i class="fi-check"></i>';
				}

			}

		}
	}
	if(filter_course_id)
	{
		document.getElementById("id_filter_course").innerHTML = filter_course_name;
		if ( !document.getElementById("id_filter_course").classList.contains('is-selected'))
		{
			document.getElementById("id_filter_course").classList.add('is-selected');
		}

	}
	else
	{
		if(filter_course_close_to_me)
		{
			document.getElementById("id_filter_course").innerHTML = lang['close_to_me'];
			if ( !document.getElementById("id_filter_course").classList.contains('is-selected'))
			{
				document.getElementById("id_filter_course").classList.add('is-selected');
			}
		}
		else if(filter_course_area)
		{
			document.getElementById("id_filter_course").innerHTML = filter_course_area;
			if(filter_course_city)
			{
				document.getElementById("id_filter_course").innerHTML += ","+filter_course_city;
			}

			if ( !document.getElementById("id_filter_course").classList.contains('is-selected'))
			{
				document.getElementById("id_filter_course").classList.add('is-selected');
			}
		}
		else
		{
			document.getElementById("id_filter_course").innerHTML = lang['course'];
			if (document.getElementById("id_filter_course").classList.contains('is-selected'))
			{
				document.getElementById("id_filter_course").classList.remove('is-selected');
			}
		}
	}

	if(filter_course_close_to_me)
	{
		document.getElementById("id_close_to_me").value = filter_course_close_to_me;
	}

	if(filter_course_area)
	{
		document.getElementById("id_area").value = filter_course_area.replace(/ /g, '_');
	}

	if(filter_course_city)
	{
		document.getElementById("id_city").value = filter_course_city.replace(/ /g, '_');
	}

	// set my
	if(filter_my_array)
	{
		if(filter_my_all)
		{
			document.getElementById("id_my_all").innerHTML = lang['my_all']+'<i class="fi-check"></i>';
		}
		else
		{
			document.getElementById("id_my_all").innerHTML = lang['my_all'];
		}

		for(var i=0; i<filter_my_array.length; i++)
		{
			if(document.getElementById("id_"+filter_my_array[i]['Code']))
			{
				document.getElementById("id_"+filter_my_array[i]['Code']).innerHTML = filter_my_array[i]['Name']+' <span class="list-item-count">'+filter_my_array[i]['Count']+'</span>';
				if(filter_my == filter_my_array[i]['Code'] || filter_my_all)
				{
					document.getElementById("id_"+filter_my_array[i]['Code']).innerHTML += '<i class="fi-check"></i>';
				}
				else
				{
					document.getElementById("id_"+filter_my_array[i]['Code']).innerHTML += '<i class="fi-*">';
				}

			}

		}
	}

	if(filter_my_all)
	{
		document.getElementById("id_filter_my").innerHTML = lang['my_all'];
		if ( !document.getElementById("id_filter_my").classList.contains('is-selected'))
		{
			document.getElementById("id_filter_my").classList.add('is-selected');
		}
	}
	else
	{
		if(filter_my == 'player')
		{
			document.getElementById("id_filter_my").innerHTML = lang['player'];
			if ( !document.getElementById("id_filter_my").classList.contains('is-selected'))
			{
				document.getElementById("id_filter_my").classList.add('is-selected');
			}
		}
		else if(filter_my == 'admin')
		{
			document.getElementById("id_filter_my").innerHTML = lang['admin'];
			if ( !document.getElementById("id_filter_my").classList.contains('is-selected'))
			{
				document.getElementById("id_filter_my").classList.add('is-selected');
			}
		}
		else if(filter_my == 'official')
		{
			document.getElementById("id_filter_my").innerHTML = lang['official'];
			if ( !document.getElementById("id_filter_my").classList.contains('is-selected'))
			{
				document.getElementById("id_filter_my").classList.add('is-selected');
			}
		}
		else if(filter_my == 'followed')
		{
			document.getElementById("id_filter_my").innerHTML = lang['followed'];
			if ( !document.getElementById("id_filter_my").classList.contains('is-selected'))
			{
				document.getElementById("id_filter_my").classList.add('is-selected');
			}
		}
		else
		{
			document.getElementById("id_filter_my").innerHTML = lang['my'];
			if (document.getElementById("id_filter_my").classList.contains('is-selected'))
			{
				document.getElementById("id_filter_my").classList.remove('is-selected');
			}
		}
	}

	// set division
	if(filter_division_array)
	{
		for(var i=0; i<filter_division_array.length; i++)
		{
			var t = document.getElementById('id_division_'+filter_division_array[i]['Code']);
			if(t)
			{

				t.innerHTML = filter_division_array[i]['Fullname']+' <span class="list-item-count">'+filter_division_array[i]['Count']+'</span>';
				if(filter_division_name == filter_division_array[i]['Name'])
				{
					t.innerHTML += '<i class="fi-check"></i>';
				}

			}

		}
	}
	if(filter_division)
	{
		document.getElementById("id_filter_division").innerHTML = filter_division_name;
		if ( !document.getElementById("id_filter_division").classList.contains('is-selected'))
		{
			document.getElementById("id_filter_division").classList.add('is-selected');
		}

	}
	else
	{
		document.getElementById("id_filter_division").innerHTML = lang['division'];
		if (document.getElementById("id_filter_division").classList.contains('is-selected'))
		{
			document.getElementById("id_filter_division").classList.remove('is-selected');
		}
	}


	// set type
	if(filter_type_array)
	{
		for(var i=0; i<filter_type_array.length; i++)
		{
			if(document.getElementById("id_type"+filter_type_array[i]['Code']))
			{
				if(filter_type_array[i]['Count']>0)
					document.getElementById("id_type"+filter_type_array[i]['Code']).innerHTML = filter_type_array[i]['Name']+' <span class="list-item-count">'+filter_type_array[i]['Count']+'</span>';
				else
					document.getElementById("id_type"+filter_type_array[i]['Code']).innerHTML = filter_type_array[i]['Name'];

				if(filter_type == filter_type_array[i]['Code'] || filter_type=='c' && filter_type_array[i]['Code']>1 || filter_type=='pdga' && (filter_type_array[i]['Code']==10 || filter_type_array[i]['Code']==11 || filter_type_array[i]['Code']==12))
				{
					document.getElementById("id_type"+filter_type_array[i]['Code']).innerHTML += '<i class="fi-check"></i>';
				}
				else
				{
					document.getElementById("id_type"+filter_type_array[i]['Code']).innerHTML += '<i class="fi-*">';
				}
			}

		}
	}
	if(filter_type)
	{
		document.getElementById("id_filter_type").innerHTML = filter_type_name;
		if ( !document.getElementById("id_filter_type").classList.contains('is-selected'))
		{
			document.getElementById("id_filter_type").classList.add('is-selected');
		}
	}
	else
	{
		document.getElementById("id_filter_type").innerHTML = lang['type'];
		if (document.getElementById("id_filter_type").classList.contains('is-selected'))
		{
			document.getElementById("id_filter_type").classList.remove('is-selected');
		}
	}
}

function setFuture()
{
	var d = new Date();
	var d2 = new Date();

	filter_period = 'next';
	filter_period_duration = 'future';
	filter_registration_open = '';
	filter_registration_will_open = '';
	filter_sort_name = 'date';
	filter_sort_order = 'asc';

	d.setDate(d.getDate());
	filter_date1 = d.toISOString().slice(0,10);

	filter_date2 = '';

	setFilters();
	showCompetitions3();
	$('#dropdown-date').foundation('close');

	setCountryList();
	setClubList();
	setCourseList();
	setMyList();
	setDivisionList();
	setTypeList();

	ChangeUrl();
}

function setPast()
{
	var d = new Date();
	var d2 = new Date();

	filter_period = 'prev';
	filter_period_duration = 'past';
	filter_registration_open = '';
	filter_registration_will_open = '';

	filter_sort_name = 'date';
	filter_sort_order = 'desc';

	filter_date1 = '';

	d2.setDate(d2.getDate() - 1);
	filter_date2 = d2.toISOString().slice(0,10);

	setFilters();
	showCompetitions3();
	$('#dropdown-date').foundation('close');

	setCountryList();
	setClubList();
	setCourseList();
	setMyList();
	setDivisionList();
	setTypeList();

	ChangeUrl();
}

function setPeriod(period)
{
	if(document.getElementById("id_filter_set_name"))
		document.getElementById("id_filter_set_name").innerHTML = lang['custom'];
	filter_set_id = 0;
	filter_period = period;

	list_from = 1;
	list_to = list_page_count;

	var d = new Date();
	var d2 = new Date();

	if(period == 'today')
	{
		d.setDate(d.getDate());
		filter_date1 = d.toISOString().slice(0,10);
		filter_date2 = filter_date1;

		setFilters();
		showCompetitions3();
		$('#dropdown-date').foundation('close');
	}

	if(period == 'yesterday')
	{
		d.setDate(d.getDate() - 1);
		filter_date1 = d.toISOString().slice(0,10);
		filter_date2 = filter_date1;

		setFilters();
		showCompetitions3();
		$('#dropdown-date').foundation('close');
	}

	if(period == 'currentweek')
	{
		d.setDate(d.getDate() - d.getDay() + 1);
		filter_date1 = d.toISOString().slice(0,10);

		d.setDate(d.getDate() + 6);
		filter_date2 = d.toISOString().slice(0,10);

		setFilters();
		showCompetitions3();
		$('#dropdown-date').foundation('close');
	}

	if(period == 'currentmonth')
	{
		d2 = new Date(d.getFullYear(), d.getMonth(), 2);
		filter_date1 = d2.toISOString().slice(0,10);

		d2 = new Date(d.getFullYear(), d.getMonth() + 1, 1);
		filter_date2 = d2.toISOString().slice(0,10);

		setFilters();
		showCompetitions3();
		$('#dropdown-date').foundation('close');
	}

	if(period == 'currentyear')
	{
		d = new Date(d.getFullYear(), 0, 2);
		filter_date1 = d.toISOString().slice(0,10);

		var lastDay = new Date(d.getFullYear() + 1, 0, 1);
		filter_date2 = lastDay.toISOString().slice(0,10);

		setFilters();
		showCompetitions3();
		$('#dropdown-date').foundation('close');

	}

	if(period == 'next')
	{
		days = document.getElementById("id_next").value;
		if(days>0)
		{
			filter_period_duration = parseInt(days);

			d.setDate(d.getDate());
			filter_date1 = d.toISOString().slice(0,10);

			d2.setDate(d2.getDate() + parseInt(days));
			filter_date2 = d2.toISOString().slice(0,10);

			setFilters();
			showCompetitions3();
			$('#dropdown-date').foundation('close');
		}
		else if(days == 'future')
		{

			filter_period_duration = 'future';
			filter_sort_name = 'date';
			filter_sort_order = 'asc';

			d.setDate(d.getDate());
			filter_date1 = d.toISOString().slice(0,10);

			filter_date2 = '';

			setFilters();
			showCompetitions3();
			$('#dropdown-date').foundation('close');
		}
	}

	if(period == 'prev')
	{
		days = document.getElementById("id_prev").value;
		if(days>0)
		{
			filter_period_duration = parseInt(days);

			d.setDate(d.getDate() - parseInt(days));
			filter_date1 = d.toISOString().slice(0,10);

			d2.setDate(d2.getDate() - 1);
			filter_date2 = d2.toISOString().slice(0,10);

			setFilters();
			showCompetitions3();
			$('#dropdown-date').foundation('close');
		}
		else if(days == 'past')
		{
			filter_period_duration = 'past';
			filter_sort_name = 'date';
			filter_sort_order = 'desc';

			filter_date1 = '';

			d2.setDate(d2.getDate() - 1);
			filter_date2 = d2.toISOString().slice(0,10);

			setFilters();
			showCompetitions3();
			$('#dropdown-date').foundation('close');
		}
	}

	setCountryList();
	setClubList();
	setCourseList();
	setMyList();
	setDivisionList();
	setTypeList();

	ChangeUrl();
}

function setFilterDate1(date)
{
	if(document.getElementById("id_filter_set_name"))
		document.getElementById("id_filter_set_name").innerHTML = lang['custom'];
	filter_set_id = 0;
	filter_period = '';
	filter_date1 = date;

	if(filter_date1 && filter_date1>filter_date2)
		filter_date2 = filter_date1;

	list_from = 1;
	list_to = list_page_count;

	setFilters();
	showCompetitions3();

	setCountryList();
	setClubList();
	setCourseList();
	setMyList();
	setDivisionList();
	setTypeList();

	ChangeUrl();

}

function setFilterDate2(date)
{
	if(document.getElementById("id_filter_set_name"))
		document.getElementById("id_filter_set_name").innerHTML = lang['custom'];
	filter_set_id = 0;
	filter_period = '';
	filter_date2 = date;
	if(filter_date2 && filter_date2<filter_date1)
		filter_date1 = filter_date2;

	list_from = 1;
	list_to = list_page_count;

	setFilters();
	showCompetitions3();

	setCountryList();
	setClubList();
	setCourseList();
	setMyList();
	setDivisionList();
	setTypeList();

	ChangeUrl();

}

function setFilterDate1Horisontal(date)
{
	if(document.getElementById("id_filter_set_name"))
		document.getElementById("id_filter_set_name").innerHTML = lang['custom'];
	filter_set_id = 0;
	filter_period = '';
	filter_date1 = date;
	filter_date2 = date;

	//if(filter_date1 && filter_date1>filter_date2)
	//	filter_date2 = filter_date1;

	list_from = 1;
	list_to = list_page_count;

	setFilters();

	showCompetitions3();

	setCountryList();
	setClubList();
	setCourseList();
	setMyList();
	setDivisionList();
	setTypeList();

	ChangeUrl();
}

function setFilterDate1Horisonta2(date)
{
	if(document.getElementById("id_filter_set_name"))
		document.getElementById("id_filter_set_name").innerHTML = lang['custom'];
	filter_set_id = 0;
	filter_period = '';

	filter_date1 = date;
	filter_date2 = date;

	//if(filter_date2 && filter_date2<filter_date1)
	//	filter_date1 = filter_date2;

	list_from = 1;
	list_to = list_page_count;

	setFilters();

	showCompetitions3();

	setCountryList();
	setClubList();
	setCourseList();
	setMyList();
	setDivisionList();
	setTypeList();

	ChangeUrl();
}

function setFilterDate2Horisontal(date)
{
	$('.datepicker').datepicker('remove');
	if(document.getElementById("id_filter_set_name"))
		document.getElementById("id_filter_set_name").innerHTML = lang['custom'];
	filter_set_id = 0;
	filter_period = '';
	filter_date1 = date;
	filter_date2 = date;

	//if(filter_date1 && filter_date1>filter_date2)
	//	filter_date2 = filter_date1;

	list_from = 1;
	list_to = list_page_count;

	setFilters();
	showCompetitions3();

	setCountryList();
	setClubList();
	setCourseList();
	setMyList();
	setDivisionList();
	setTypeList();

	ChangeUrl();

}

// moves the period with 1 day
function setFilterDateMove(days)
{
	if(document.getElementById("id_filter_set_name"))
		document.getElementById("id_filter_set_name").innerHTML = lang['custom'];
	filter_set_id = 0;
	filter_period = '';

	var d1 = new Date(filter_date1);
	var d2 = new Date(filter_date2);

	d1.setDate(d1.getDate()+days);
	d2.setDate(d2.getDate()+days);

	filter_date1 = d1.toISOString().slice(0,10);
	filter_date2 = d2.toISOString().slice(0,10);

	list_from = 1;
	list_to = list_page_count;

	setFilters();
	showCompetitions3();

	setCountryList();
	setClubList();
	setCourseList();
	setMyList();
	setDivisionList();
	setTypeList();

	ChangeUrl();

}

function setButtonRegistrationOpen()
{
	filter_period = '';
	filter_date1 = '';
	filter_date2 = '';
	setRegistrationOpen();
}

function setButtonRegistrationWillOpen()
{
	filter_period = '';
	filter_date1 = '';
	filter_date2 = '';
	setRegistrationWillOpen();
}

function setRegistrationOpen(value)
{

	if(document.getElementById("id_filter_set_name"))
		document.getElementById("id_filter_set_name").value=lang['custom'];
	filter_set_id = 0;
	filter_registration_open = '1';
	filter_registration_will_open = '';
	filter_registration_date1 = '';
	filter_registration_date2 = '';

	filter_sort_name = 'date';
	filter_sort_order = 'asc';

	list_from = 1;
	list_to = list_page_count;

	setFilters();
	showCompetitions3();
	$('#dropdown-registration').foundation('close');

	setCountryList();
	setClubList();
	setCourseList();
	setMyList();
	setDivisionList();
	setTypeList();

	ChangeUrl();

}

function setRegistrationWillOpen()
{

	if(document.getElementById("id_filter_set_name"))
		document.getElementById("id_filter_set_name").value=lang['custom'];
	filter_set_id = 0;
	filter_registration_open = '';
	filter_registration_will_open = '1';
	filter_registration_date1 = '';
	filter_registration_date2 = '';

	filter_sort_name = 'registration';
	filter_sort_order = 'asc';

	list_from = 1;
	list_to = list_page_count;

	setFilters();
	showCompetitions3();
	$('#dropdown-registration').foundation('close');

	setCountryList();
	setClubList();
	setCourseList();
	setMyList();
	setDivisionList();
	setTypeList();

	ChangeUrl();

}

function setRegistrationDate1(date)
{
	if(document.getElementById("id_filter_set_name"))
		document.getElementById("id_filter_set_name").innerHTML = lang['custom'];
	filter_set_id = 0;

	filter_registration_open = '';
	filter_registration_will_open = '';
	filter_registration_date1 = date;

	if(filter_registration_date1 && filter_registration_date2 && filter_registration_date1>filter_registration_date2)
		filter_registration_date2 = filter_registration_date1;

	list_from = 1;
	list_to = list_page_count;

	setFilters();
	showCompetitions3();

	setCountryList();
	setClubList();
	setCourseList();
	setMyList();
	setDivisionList();
	setTypeList();

	ChangeUrl();

}

function setRegistrationDate2(date)
{
	if(document.getElementById("id_filter_set_name"))
		document.getElementById("id_filter_set_name").innerHTML = lang['custom'];
	filter_set_id = 0;

	filter_registration_open = '';
	filter_registration_will_open = '';
	filter_registration_date2 = date;
	if(filter_registration_date2 && filter_registration_date2<filter_registration_date1)
		filter_registration_date1 = filter_registration_date2;

	list_from = 1;
	list_to = list_page_count;

	setFilters();
	showCompetitions3();

	setCountryList();
	setClubList();
	setCourseList();
	setMyList();
	setDivisionList();
	setTypeList();

	ChangeUrl();

}


function setRegistrationReset()
{
	if(document.getElementById("id_filter_set_name"))
		document.getElementById("id_filter_set_name").value=lang['custom'];
	filter_set_id = 0;
    filter_registration_open = '';
    filter_registration_will_open = '';
	filter_registration_date1 = '';
	filter_registration_date2 = '';

	list_from = 1;
	list_to = list_page_count;

	setFilters();
	showCompetitions3();
	$('#dropdown-registration').foundation('close');

	setCountryList();
	setClubList();
	setCourseList();
	setMyList();
	setDivisionList();
	setTypeList();

	ChangeUrl();
}

function setCountryList()
{

	var xmlhttp;
	if (window.XMLHttpRequest)
	{   // code for IE7+, Firefox, Chrome, Opera, Safari
		xmlhttp=new XMLHttpRequest();
	}

	xmlhttp.onreadystatechange=function()
	{
		if (xmlhttp.readyState==4 && xmlhttp.status==200)
		{
			filter_country_array = JSON.parse(xmlhttp.responseText, false);

			list = document.getElementById("id_filter_country_list");

			setCountryListScreen();
		}
	}

	if(filter_course_close_to_me)
	{
		var lat = '';
		var lng = '';
		if(gps_position)
		{
			lat = gps_position.coords.latitude;
			lng = gps_position.coords.longitude;
		}
	}

	xmlhttp.open("GET","api_internal.php?content=country_search&competition_name="+filter_name+"&date1="+filter_date1+"&date2="+filter_date2+"&registration_date1="+filter_registration_date1+"&registration_date2="+filter_registration_date2+"&registration_open="+filter_registration_open+"&association_id="+filter_association_id+"&club_type="+filter_club_type+"&club_id="+filter_club_id+"&course_id="+filter_course_id+"&close_to_me="+filter_course_close_to_me+"&division="+filter_division_name+"&my="+filter_my+"&type="+filter_type+"&my_all="+filter_my_all+"&lat="+lat+"&lng="+lng,true);
	xmlhttp.send();
}

function setCountryListScreen()
{
	var country_text = '';
	var t = document.getElementById("id_filter_country_text");
	if(t.value)
	{
		country_text = t.value.toUpperCase();
	}

	list = document.getElementById("id_filter_country_list");

	// make list empty, delete all country nodes
	len = list.childElementCount;
	for(var i=4; i<=len; i++)
	{
		list.removeChild(list.lastChild);
	}
	// fill new list
	if(filter_country_array)
	{
		for(var i=0; i<filter_country_array.length; i++)
		{
			var n = filter_country_array[i]['Name'].search(country_text);
			if(n==0 || country_text=='')
			{
				var li = document.createElement("li");
				if(filter_country_code == filter_country_array[i]['Code'])
					li.innerHTML = '<a id="id_country'+filter_country_array[i]['Code']+'" class="list-action-row" onclick="setCountry('+"'"+filter_country_array[i]['Code']+"'"+','+"'"+filter_country_array[i]['Name']+"'"+')">'+filter_country_array[i]['Name']+' <span class="list-item-count">'+filter_country_array[i]['Count']+'</span><i class="fi-check"></i></a>';
				else
					li.innerHTML = '<a id="id_country'+filter_country_array[i]['Code']+'" class="list-action-row" onclick="setCountry('+"'"+filter_country_array[i]['Code']+"'"+','+"'"+filter_country_array[i]['Name']+"'"+')">'+filter_country_array[i]['Name']+' <span class="list-item-count">'+filter_country_array[i]['Count']+'</span><i class="fi-*"></i></a>';
				list.appendChild(li);
			}
		}
	}
}

function setCountry(code, name)
{
	if(document.getElementById("id_filter_set_name"))
		document.getElementById("id_filter_set_name").innerHTML = lang['custom'];
	filter_set_id = 0;
	filter_my_country = '';
	filter_country_code = code;
	filter_country_name = name;

	list_from = 1;
	list_to = list_page_count;

	setFilters();
	showCompetitions3();
	$('#dropdown-country').foundation('close');

	document.getElementById("id_filter_country_text").value = "";
	setCountryList();
	setClubList();
	setCourseList();
	setMyList();
	setDivisionList();
	setTypeList();

	setAreaList();

	ChangeUrl();

}

function setMyCountry(code, name)
{
	if(document.getElementById("id_filter_set_name"))
		document.getElementById("id_filter_set_name").innerHTML = lang['custom'];
	filter_set_id = 0;
	filter_my_country = 1;
	filter_country_code = code;
	filter_country_name = name;

	list_from = 1;
	list_to = list_page_count;

	setFilters();
	showCompetitions3();
	$('#dropdown-country').foundation('close');

	document.getElementById("id_filter_country_text").value = "";
	setCountryList();
	setClubList();
	setCourseList();
	setMyList();
	setDivisionList();
	setTypeList();

	setAreaList();

	ChangeUrl();

}

function setCountryReset()
{
	if(document.getElementById("id_filter_set_name"))
		document.getElementById("id_filter_set_name").innerHTML = lang['custom'];
	filter_set_id = 0;
	filter_my_country = '';
	filter_country_code = '';
	filter_country_name = '';

	list_from = 1;
	list_to = list_page_count;

	setFilters();
	showCompetitions3();
	$('#dropdown-country').foundation('close');

	document.getElementById("id_filter_country_text").value = "";
	setCountryList();
	setClubList();
	setCourseList();
	setMyList();
	setDivisionList();
	setTypeList();

	setAreaList();

	ChangeUrl();
}


function setClubList()
{

	var xmlhttp;
	if (window.XMLHttpRequest)
	{   // code for IE7+, Firefox, Chrome, Opera, Safari
		xmlhttp=new XMLHttpRequest();
	}

	xmlhttp.onreadystatechange=function()
	{
		if (xmlhttp.readyState==4 && xmlhttp.status==200)
		{
			filter_club_array = JSON.parse(xmlhttp.responseText, false);

			setClubListScreen();
		}
	}

	if(filter_course_close_to_me)
	{
		var lat = '';
		var lng = '';
		if(gps_position)
		{
			lat = gps_position.coords.latitude;
			lng = gps_position.coords.longitude;
		}
	}

	xmlhttp.open("GET","api_internal.php?content=club_search&competition_name="+filter_name+"&date1="+filter_date1+"&date2="+filter_date2+"&registration_date1="+filter_registration_date1+"&registration_date2="+filter_registration_date2+"&registration_open="+filter_registration_open+"&country_code="+filter_country_code+"&course_id="+filter_course_id+"&association_id="+filter_association_id+"&close_to_me="+filter_course_close_to_me+"&division="+filter_division_name+"&my="+filter_my+"&type="+filter_type+"&my_all="+filter_my_all+"&lat="+lat+"&lng="+lng,true);
	xmlhttp.send();
}

function setClubListScreen()
{

	var club_text = '';
	var t = document.getElementById("id_filter_club_text");
	if(t.value)
	{
		club_text = t.value.toUpperCase();
	}

	list = document.getElementById("id_filter_club_list");

	// make list empty, delete all
	len = list.childElementCount;
	for(var i=4; i<=len; i++)
	{
		list.removeChild(list.lastChild);
	}

	// fill new list
	if(filter_club_array)
	{
		code = filter_club_id.split(",");
		for(var i=0; i<filter_club_array.length; i++)
		{
			var n = filter_club_array[i]['Name'].toUpperCase().search(club_text);
			if(n>=0 || club_text=='')
			{
				var li = document.createElement("li");

				active = 0;


				for(j=0; j<code.length; j++)
				{
					if(filter_club_type==filter_club_array[i]['Type'] && code[j]==filter_club_array[i]['ID'])
					{
						active = 1;
					}
				}

				if(!active)
				{
					if(1==filter_club_array[i]['Type'] && filter_association_id==filter_club_array[i]['ID'])
					{
						active = 1;
					}
				}

				if(active)
				{
					li.innerHTML = '<a id="id_'+filter_club_array[i]['Type']+'_'+filter_club_array[i]['ID']+'" class="list-action-row" onclick="setClub('+"'"+filter_club_array[i]['Type']+"'"+','+"'"+filter_club_array[i]['ID']+"'"+','+"'"+filter_club_array[i]['Name']+"'"+')">'+filter_club_array[i]['Name']+' <span class="list-item-count">'+filter_club_array[i]['Count']+'</span><i class="fi-check"></i></a>';
				}
				else
				{
					li.innerHTML = '<a id="id_'+filter_club_array[i]['Type']+'_'+filter_club_array[i]['ID']+'" class="list-action-row" onclick="setClub('+"'"+filter_club_array[i]['Type']+"'"+','+"'"+filter_club_array[i]['ID']+"'"+','+"'"+filter_club_array[i]['Name']+"'"+')">'+filter_club_array[i]['Name']+' <span class="list-item-count">'+filter_club_array[i]['Count']+'</span><i class="fi-*"></i></a>';

				}
				list.appendChild(li);
			}
		}
	}
}

function setMyClub(id, name)
{
	if(document.getElementById("id_filter_set_name"))
		document.getElementById("id_filter_set_name").innerHTML = lang['custom'];
	filter_set_id = 0;
	filter_my_club = 1;
	filter_club_type = 2; // not association
	filter_club_id = id;
	filter_club_name = name;

	list_from = 1;
	list_to = list_page_count;

	setFilters();
	showCompetitions3();
	$('#dropdown-club').foundation('close');

	document.getElementById("id_filter_club_text").value = "";
	setClubList();
	setCountryList();
	setCourseList();
	setMyList();
	setDivisionList();
	setTypeList();

	ChangeUrl();
}

function setClub(type, id, name)
{
	if(document.getElementById("id_filter_set_name"))
		document.getElementById("id_filter_set_name").innerHTML = lang['custom'];
	filter_set_id = 0;
	filter_my_club = 0;
	filter_club_type = type;
	filter_club_id = id;
	filter_club_name = name;

	list_from = 1;
	list_to = list_page_count;

	setFilters();
	showCompetitions3();
	$('#dropdown-club').foundation('close');

	document.getElementById("id_filter_club_text").value = "";
	setClubList();
	setCountryList();
	setCourseList();
	setMyList();
	setDivisionList();
	setTypeList();

	ChangeUrl();
}

function setClubReset()
{
	if(document.getElementById("id_filter_set_name"))
		document.getElementById("id_filter_set_name").innerHTML = lang['custom'];

	filter_set_id = 0;
	filter_my_club = 0;

	filter_club_type = '';
	filter_club_id = '';
	filter_club_name = '';

	list_from = 1;
	list_to = list_page_count;

	setFilters();
	showCompetitions3();
	$('#dropdown-club').foundation('close');

	document.getElementById("id_filter_club_text").value = "";

	setClubList();
	setCountryList();
	setCourseList();
	setMyList();
	setDivisionList();
	setTypeList();

	ChangeUrl();

}

function setCourseList()
{

	var xmlhttp;
	if (window.XMLHttpRequest)
	{   // code for IE7+, Firefox, Chrome, Opera, Safari
		xmlhttp=new XMLHttpRequest();
	}

	xmlhttp.onreadystatechange=function()
	{
		if (xmlhttp.readyState==4 && xmlhttp.status==200)
		{
			filter_course_array = JSON.parse(xmlhttp.responseText, false);

			setCourseListScreen();
		}
	}

	if(filter_course_close_to_me)
	{
		var lat = '';
		var lng = '';
		if(gps_position)
		{
			lat = gps_position.coords.latitude;
			lng = gps_position.coords.longitude;
		}
	}

	xmlhttp.open("GET","api_internal.php?content=course_search&competition_name="+filter_name+"&date1="+filter_date1+"&date2="+filter_date2+"&registration_date1="+filter_registration_date1+"&registration_date2="+filter_registration_date2+"&registration_open="+filter_registration_open+"&country_code="+filter_country_code+"&close_to_me="+filter_course_close_to_me+"&association_id="+filter_association_id+"&club_type="+filter_club_type+"&club_id="+filter_club_id+"&division="+filter_division_name+"&my="+filter_my+"&type="+filter_type+"&my_all="+filter_my_all+"&lat="+lat+"&lng="+lng+"&area="+filter_course_area+"&city="+filter_course_city,true);
	xmlhttp.send();
}

function setCourseListScreen()
{
	var course_text = '';
	var t = document.getElementById("id_filter_course_text");
	if(t.value)
	{
		course_text = t.value.toUpperCase();
	}

	list = document.getElementById("id_filter_course_list");

	// make list empty, delete all course nodes
	len = list.childElementCount;
	for(var i=6; i<=len; i++)
	{
		list.removeChild(list.lastChild);
	}

	// fill new list
	if(filter_course_array)
	{
		for(var i=0; i<filter_course_array.length; i++)
		{

			var n = filter_course_array[i]['Name'].toUpperCase().search(course_text);
			if(n>=0 || course_text=='')
			{
				var li = document.createElement("li");
				if(filter_course_id==filter_course_array[i]['ID'])
				{
					li.innerHTML = '<a id="id_course'+filter_course_array[i]['ID']+'" class="list-action-row" onclick="setCourse('+"'"+filter_course_array[i]['ID']+"'"+','+"'"+filter_course_array[i]['Name']+"'"+')">'+filter_course_array[i]['Name']+' <span class="list-item-count">'+filter_course_array[i]['Count']+'</span><i class="fi-check"></i></a>';
				}
				else
				{
					li.innerHTML = '<a id="id_course'+filter_course_array[i]['ID']+'" class="list-action-row" onclick="setCourse('+"'"+filter_course_array[i]['ID']+"'"+','+"'"+filter_course_array[i]['Name']+"'"+')">'+filter_course_array[i]['Name']+' <span class="list-item-count">'+filter_course_array[i]['Count']+'</span><i class="fi-*"></a>';

				}
				list.appendChild(li);
			}
		}
	}
}

function setCourse(id, name)
{
	if(document.getElementById("id_filter_set_name"))
		document.getElementById("id_filter_set_name").innerHTML = lang['custom'];
	filter_set_id = 0;
	filter_course_id = id;
	filter_course_name = name;

	list_from = 1;
	list_to = list_page_count;

	setFilters();
	showCompetitions3();
	$('#dropdown-course').foundation('close');

	document.getElementById("id_filter_course_text").value = "";
	document.getElementById("id_close_to_me").value = "";
	setClubList();
	setCountryList();
	setMyList();
	setDivisionList();
	setTypeList();

	ChangeUrl();
}

function setCourseCloseToMe()
{
	filter_course_id = '';
	filter_course_name = '';
	filter_course_close_to_me = document.getElementById("id_close_to_me").value;
	document.getElementById("id_area").value = "0";
	document.getElementById("id_city").innerHTML = "";
	filter_course_area = '';
	filter_course_city = '';


	list_from = 1;
	list_to = list_page_count;

	setFilters();
	showCompetitions3();
	$('#dropdown-course').foundation('close');

	document.getElementById("id_filter_course_text").value = "";
	setCourseList();
	setClubList();
	setCountryList();
	setMyList();
	setDivisionList();
	setTypeList();

	ChangeUrl();
}

function setCourseReset()
{
	if(document.getElementById("id_filter_set_name"))
		document.getElementById("id_filter_set_name").innerHTML = lang['custom'];
	filter_set_id = 0;
	filter_course_id = '';
	filter_course_name = '';
	filter_course_close_to_me = '';
	filter_course_area = '';
	filter_course_city = '';

	list_from = 1;
	list_to = list_page_count;

	setFilters();
	showCompetitions3();
	$('#dropdown-course').foundation('close');

	document.getElementById("id_filter_course_text").value = "";
	document.getElementById("id_close_to_me").value = "";
	document.getElementById("id_area").value = "0";
	document.getElementById('id_city').innerHTML = '';
	setCourseList();
	setClubList();
	setCountryList();
	setMyList();
	setDivisionList();
	setTypeList();


	ChangeUrl();
}

function setAreaList()
{
	var xmlhttp;
	if (window.XMLHttpRequest)
	{   // code for IE7+, Firefox, Chrome, Opera, Safari
		xmlhttp=new XMLHttpRequest();
	}

	xmlhttp.onreadystatechange=function()
	{
		if (xmlhttp.readyState==4 && xmlhttp.status==200)
		{
			document.getElementById('id_area').innerHTML = xmlhttp.responseText;
			document.getElementById('id_area').value = filter_course_area.replace(/ /g, '_');
		}
	}

	xmlhttp.open("GET","api_internal.php?content=get_course_area_list&country_code="+filter_country_code+"&association_id="+filter_association_id,true);
	xmlhttp.send();
}

function setCourseArea()
{

	filter_course_id = '';
	filter_course_name = '';
	filter_course_close_to_me = '';
	filter_course_area = document.getElementById("id_area").options[document.getElementById("id_area").selectedIndex].text;
	if(document.getElementById("id_area").value=="0")
		filter_course_area = '';
	filter_course_city = '';
	list_from = 1;
	list_to = list_page_count;

	setFilters();
	showCompetitions3();
	$('#dropdown-course').foundation('close');

	document.getElementById("id_filter_course_text").value = "";
	document.getElementById("id_close_to_me").value = "";
	setCourseList();
	setClubList();
	setCountryList();
	setMyList();
	setDivisionList();
	setTypeList();

	setCityList();

	ChangeUrl();
}

function setCityList()
{
	var xmlhttp;
	if (window.XMLHttpRequest)
	{   // code for IE7+, Firefox, Chrome, Opera, Safari
		xmlhttp=new XMLHttpRequest();
	}

	xmlhttp.onreadystatechange=function()
	{
		if (xmlhttp.readyState==4 && xmlhttp.status==200)
		{
			document.getElementById('id_city').innerHTML = xmlhttp.responseText;
			document.getElementById('id_city').value = filter_course_city.replace(/ /g, '_');
		}
	}

	xmlhttp.open("GET","api_internal.php?content=get_course_city_list&country_code="+filter_country_code+"&area="+filter_course_area,true);
	xmlhttp.send();
}

function setCourseCity()
{
	filter_course_id = '';
	filter_course_name = '';
	filter_course_close_to_me = '';
	filter_course_city = document.getElementById("id_city").options[document.getElementById("id_city").selectedIndex].text;
	if(document.getElementById("id_city").value=="0")
		filter_course_city = '';

	list_from = 1;
	list_to = list_page_count;

	setFilters();
	showCompetitions3();
	$('#dropdown-course').foundation('close');

	document.getElementById("id_filter_course_text").value = "";
	setCourseList();
	setClubList();
	setCountryList();
	setMyList();
	setDivisionList();
	setTypeList();

	ChangeUrl();
}


function setMyList()
{

	var xmlhttp;
	if (window.XMLHttpRequest)
	{   // code for IE7+, Firefox, Chrome, Opera, Safari
		xmlhttp=new XMLHttpRequest();
	}

	xmlhttp.onreadystatechange=function()
	{
		if (xmlhttp.readyState==4 && xmlhttp.status==200)
		{
			filter_my_array = JSON.parse(xmlhttp.responseText, false);
			list = document.getElementById("id_filter_my_list");

			// make list empty, delete all country nodes
			len = list.childElementCount;
			for(var i=3; i<=len; i++)
			{
				list.removeChild(list.lastChild);
			}

			// fill new list
			if(filter_my_array)
			{
				for(var i=0; i<filter_my_array.length; i++)
				{

					var li = document.createElement("li");
					if(filter_my==filter_my_array[i]['Code'] || filter_my_all)
					{
						li.innerHTML = '<a id="id_'+filter_my_array[i]['Code']+'" class="list-action-row" onclick="setMy('+"'"+filter_my_array[i]['Code']+"'"+')">'+filter_my_array[i]['Name']+' <span class="list-item-count">'+filter_my_array[i]['Count']+'</span><i class="fi-check"></i></a>';

					}
					else
					{
						li.innerHTML = '<a id="id_'+filter_my_array[i]['Code']+'" class="list-action-row" onclick="setMy('+"'"+filter_my_array[i]['Code']+"'"+')">'+filter_my_array[i]['Name']+' <span class="list-item-count">'+filter_my_array[i]['Count']+'</span><i class="fi-*"></i></a>';
					}
					list.appendChild(li);

				}
			}
		}
	}

	if(filter_course_close_to_me)
	{
		var lat = '';
		var lng = '';
		if(gps_position)
		{
			lat = gps_position.coords.latitude;
			lng = gps_position.coords.longitude;
		}
	}

	xmlhttp.open("GET","api_internal.php?content=my_search&competition_name="+filter_name+"&date1="+filter_date1+"&date2="+filter_date2+"&registration_date1="+filter_registration_date1+"&registration_date2="+filter_registration_date2+"&registration_open="+filter_registration_open+"&country_code="+filter_country_code+"&association_id="+filter_association_id+"&club_type="+filter_club_type+"&club_id="+filter_club_id+"&course_id="+filter_course_id+"&close_to_me="+filter_course_close_to_me+"&division="+filter_division_name+"&type="+filter_type+"&lat="+lat+"&lng="+lng,true);
	xmlhttp.send();
}

function setMy(value)
{
	if(document.getElementById("id_filter_set_name"))
		document.getElementById("id_filter_set_name").innerHTML=lang['custom'];
	filter_set_id = 0;
	filter_my = value;
	filter_my_all = '';

	list_from = 1;
	list_to = list_page_count;

	setFilters();
	showCompetitions3();
	$('#dropdown-my').foundation('close');
	setCountryList();
	setClubList();
	setCourseList();
	setDivisionList();
	setTypeList();

	ChangeUrl();

}

function setMyAll()
{
	if(document.getElementById("id_filter_set_name"))
		document.getElementById("id_filter_set_name").innerHTML=lang['custom'];
	filter_set_id = 0;
	filter_my_all = '1';
	filter_my = '';

	list_from = 1;
	list_to = list_page_count;

	setFilters();
	showCompetitions3();
	$('#dropdown-my').foundation('close');
	setCountryList();
	setClubList();
	setCourseList();
	setDivisionList();
	setTypeList();

	ChangeUrl();
}

function setMyReset()
{
	if(document.getElementById("id_filter_set_name"))
		document.getElementById("id_filter_set_name").innerHTML = lang['custom'];
	filter_set_id = 0;
	filter_my = '';
	filter_my_all = '';

	list_from = 1;
	list_to = list_page_count;

	setFilters();
	showCompetitions3();
	$('#dropdown-my').foundation('close');
	setCountryList();
	setClubList();
	setCourseList();
	setDivisionList();
	setTypeList();

	ChangeUrl();
}

function setTypeList()
{

	var xmlhttp;
	if (window.XMLHttpRequest)
	{   // code for IE7+, Firefox, Chrome, Opera, Safari
		xmlhttp=new XMLHttpRequest();
	}

	xmlhttp.onreadystatechange=function()
	{
		if (xmlhttp.readyState==4 && xmlhttp.status==200)
		{

			filter_type_array = JSON.parse(xmlhttp.responseText, false);

			list = document.getElementById("id_filter_type_list");

			// make list empty, delete all country nodes
			len = list.childElementCount;
			for(var i=2; i<=len; i++)
			{
				list.removeChild(list.lastChild);
			}

			// fill new list
			if(filter_type_array)
			{
				for(var i=0; i<filter_type_array.length; i++)
				{

					var li = document.createElement("li");
					if(filter_type_array[i]['Count']>0)
					{
						if(filter_type==filter_type_array[i]['Code'])
						{
							li.innerHTML = '<a id="id_type'+filter_type_array[i]['Code']+'" class="list-action-row" onclick="setType('+"'"+filter_type_array[i]['Code']+"'"+','+"'"+filter_type_array[i]['Name']+"'"+')">'+filter_type_array[i]['Name']+' <span class="list-item-count">'+filter_type_array[i]['Count']+'</span><i class="fi-check"></i></a>';
							filter_type_name = filter_type_array[i]['Name'];
						}
						else
						{
							li.innerHTML = '<a id="id_type'+filter_type_array[i]['Code']+'" class="list-action-row" onclick="setType('+"'"+filter_type_array[i]['Code']+"'"+','+"'"+filter_type_array[i]['Name']+"'"+')">'+filter_type_array[i]['Name']+' <span class="list-item-count">'+filter_type_array[i]['Count']+'</span><i class="fi-*"></i></a>';
						}
					}
					else
					{
						if(filter_type==filter_type_array[i]['Code'])
						{
							li.innerHTML = '<a id="id_type'+filter_type_array[i]['Code']+'" class="list-action-row" onclick="setType('+"'"+filter_type_array[i]['Code']+"'"+','+"'"+filter_type_array[i]['Name']+"'"+')">'+filter_type_array[i]['Name']+'<i class="fi-check"></i></a>';
							filter_type_name = filter_type_array[i]['Name'];
						}
						else
						{
							li.innerHTML = '<a id="id_type'+filter_type_array[i]['Code']+'" class="list-action-row" onclick="setType('+"'"+filter_type_array[i]['Code']+"'"+','+"'"+filter_type_array[i]['Name']+"'"+')">'+filter_type_array[i]['Name']+'<i class="fi-*"></i></a>';
						}
					}

					list.appendChild(li);

				}
			}
		}
	}

	if(filter_course_close_to_me)
	{
		var lat = '';
		var lng = '';
		if(gps_position)
		{
			lat = gps_position.coords.latitude;
			lng = gps_position.coords.longitude;
		}
	}

	xmlhttp.open("GET","api_internal.php?content=type_search&competition_name="+filter_name+"&date1="+filter_date1+"&date2="+filter_date2+"&registration_date1="+filter_registration_date1+"&registration_date2="+filter_registration_date2+"&registration_open="+filter_registration_open+"&country_code="+filter_country_code+"&association_id="+filter_association_id+"&club_type="+filter_club_type+"&club_id="+filter_club_id+"&course_id="+filter_course_id+"&close_to_me="+filter_course_close_to_me+"&division="+filter_division_name+"&my="+filter_my+"&my_all="+filter_my_all+"&lat="+lat+"&lng="+lng,true);
	xmlhttp.send();
}

function setType(value, name)
{
	if(document.getElementById("id_filter_set_name"))
		document.getElementById("id_filter_set_name").innerHTML = lang['custom'];
	filter_set_id = 0;
	filter_type = value;
	filter_type_name = name;

	list_from = 1;
	list_to = list_page_count;

	setFilters();
	showCompetitions3();
	$('#dropdown-type').foundation('close');
	setCountryList();
	setClubList();
	setCourseList();
	setDivisionList();
	setMyList();

	ChangeUrl();

}

function setTypeReset()
{
	if(document.getElementById("id_filter_set_name"))
		document.getElementById("id_filter_set_name").innerHTML = lang['custom'];
	filter_set_id = 0;
	filter_type = '';
	filter_name = '';

	list_from = 1;
	list_to = list_page_count;

	setFilters();
	showCompetitions3();
	$('#dropdown-type').foundation('close');
	setCountryList();
	setClubList();
	setCourseList();
	setDivisionList();
	setMyList();

	ChangeUrl();
}

const decodeHtmlCharCodes = str =>
	str.replace(/(&#(\d+);)/g, (match, capture, charCode) =>
		String.fromCharCode(charCode));

function setDivisionList()
{

	var xmlhttp;
	if (window.XMLHttpRequest) { // code for IE7+, Firefox, Chrome, Opera, Safari
		xmlhttp=new XMLHttpRequest();
	}

	xmlhttp.onreadystatechange=function()
	{
		if (xmlhttp.readyState==4 && xmlhttp.status==200)
		{

			filter_division_array = JSON.parse(xmlhttp.responseText, false);

			list = document.getElementById("id_filter_division_list");

			// make list empty, delete all country nodes
			len = list.childElementCount;
			for(var i=3; i<=len; i++)
			{
				list.removeChild(list.lastChild);
			}

			// fill new list
			if(filter_division_array)
			{
				for(var i=0; i<filter_division_array.length; i++)
				{

					var li = document.createElement("li");
					var icon = filter_division_name == filter_division_array[i]['Name'] ? 'check' : '*';
					li.innerHTML = '<a id="id_division_'+decodeHtmlCharCodes(filter_division_array[i]['Code'])+'" class="list-action-row" onclick="setDivision('+"'"+filter_division_array[i]['Code']+"'"+','+"'"+decodeHtmlCharCodes(filter_division_array[i]['Name'])+"'"+')">'+decodeHtmlCharCodes(filter_division_array[i]['Fullname'])+' <span class="list-item-count">'+filter_division_array[i]['Count']+'</span><i class="fi-'+icon+'"></i></a>';
					list.appendChild(li);
				}
			}
		}
	}

	if(filter_course_close_to_me)
	{
		var lat = '';
		var lng = '';
		if(gps_position)
		{
			lat = gps_position.coords.latitude;
			lng = gps_position.coords.longitude;
		}
	}

	xmlhttp.open("GET","api_internal.php?content=division_search&competition_name="+filter_name+"&date1="+filter_date1+"&date2="+filter_date2+"&registration_date1="+filter_registration_date1+"&registration_date2="+filter_registration_date2+"&registration_open="+filter_registration_open+"&country_code="+filter_country_code+"&association_id="+filter_association_id+"&club_type="+filter_club_type+"&club_id="+filter_club_id+"&course_id="+filter_course_id+"&close_to_me="+filter_course_close_to_me+"&type="+filter_type+"&my="+filter_my+"&my_all="+filter_my_all+"&lat="+lat+"&lng="+lng,true);
	xmlhttp.send();
}

function setDivisionListScreen()
{
	var division_text = '';
	var t = document.getElementById("id_filter_division_text");
	if(t.value)
	{
		division_text = t.value.toUpperCase();
	}

	list = document.getElementById("id_filter_division_list");

	// make list empty, delete all country nodes
	len = list.childElementCount;
	for(var i=3; i<=len; i++)
	{
		list.removeChild(list.lastChild);
	}
	// fill new list
	if(filter_division_array)
	{
		for(var i=0; i<filter_division_array.length; i++)
		{
			var n = filter_division_array[i]['Fullname'].toUpperCase().search(division_text);
			if(n>=0 || division_text=='')
			{
				var li = document.createElement("li");
				if(filter_division_name == filter_division_array[i]['Name'])
					li.innerHTML = '<a id="id_division_'+filter_division_array[i]['Code']+'" class="list-action-row" onclick="setDivision('+"'"+filter_division_array[i]['Code']+"'"+','+"'"+filter_division_array[i]['Name']+"'"+')">'+filter_division_array[i]['Fullname']+' <span class="list-item-count">'+filter_division_array[i]['Count']+'</span><i class="fi-check"></i></a>';
				else
					li.innerHTML = '<a id="id_division_'+filter_division_array[i]['Code']+'" class="list-action-row" onclick="setDivision('+"'"+filter_division_array[i]['Code']+"'"+','+"'"+filter_division_array[i]['Name']+"'"+')">'+filter_division_array[i]['Fullname']+' <span class="list-item-count">'+filter_division_array[i]['Count']+'</span><i class="fi-*"></i></a>';
				list.appendChild(li);
			}
		}
	}
}

function setDivision(code, name)
{
	if(document.getElementById("id_filter_set_name"))
		document.getElementById("id_filter_set_name").innerHTML = lang['custom'];
	filter_set_id = 0;
	filter_division = code;
	filter_division_name = name;

	list_from = 1;
	list_to = list_page_count;

	setFilters();
	showCompetitions3();
	$('#dropdown-division').foundation('close');
	document.getElementById("id_filter_division_text").value = "";
	setCountryList();
	setClubList();
	setCourseList();
	setTypeList();
	setMyList();

	ChangeUrl();
}

function setDivisionReset()
{
	if(document.getElementById("id_filter_set_name"))
		document.getElementById("id_filter_set_name").innerHTML = lang['custom'];
	filter_set_id = 0;
	filter_division = '';
	filter_division_name = '';

	list_from = 1;
	list_to = list_page_count;

	setFilters();
	showCompetitions3();
	$('#dropdown-division').foundation('close');
	document.getElementById("id_filter_division_text").value = "";
	setCountryList();
	setClubList();
	setCourseList();
	setTypeList();
	setMyList();

	ChangeUrl();
}

function onload()
{
}

function ChangeUrl() {

	var period = filter_period;
	if(filter_period == 'next' || filter_period == 'prev')
	{
		period = period + filter_period_duration;
	}

	if (window.URLSearchParams) {
		var search = new URLSearchParams(window.location.search);
		var from = search.get('from'), to = search.get('to');
	}

	page = '';

	url = "view="+filter_view+"&competition_name="+filter_name+"&period="+period+"&date1="+filter_date1+"&date2="+filter_date2+"&my_country="+filter_my_country+"&registration_open="+filter_registration_open+"&registration_date1="+filter_registration_date1+"&registration_date2="+filter_registration_date2+"&country_code="+filter_country_code+"&my_club="+filter_my_club+"&club_type="+filter_club_type+"&club_id="+filter_club_id+"&association_id="+filter_association_id+"&close_to_me="+filter_course_close_to_me+"&area="+filter_course_area+"&city="+filter_course_city+"&course_id="+filter_course_id+"&type="+filter_type+"&division="+encodeURIComponent(filter_division_name)+"&my="+filter_my+"&view="+filter_view+"&sort_name="+filter_sort_name+"&sort_order="+filter_sort_order+"&my_all="+filter_my_all;
	if (window.URLSearchParams && from && to) {
		url += "&from=" + from + "&to=" + to;
	}

	document.getElementById("id_save_filter_content").value = url;

	if(filter_special == 'association')
		url = "/?u=competitions_association&" + url;
	else if(filter_special == 'my')
		url = "/?u=competitions_my&" + url;
	else if(filter_special == 'all')
		url = "/?u=competitions_all&" + url;
	else
		url = "/?u=competitions_all&" + url;

	if (typeof (history.pushState) != "undefined") {
		var obj = {Page: page, Url: url};
		history.pushState(obj, obj.Page, obj.Url);
	} else {
		// alert("Browser does not support HTML5.");
	}
}

function filterReset()
{
	document.getElementById("id_filter_name").value="";
	if(document.getElementById("id_filter_set_name"))
		document.getElementById("id_filter_set_name").innerHTML = lang['custom'];
	filter_set_id = 0;

	filter_name = "";

	var curr = new Date;
	d = new Date(curr.getFullYear(), 0, 2);
	filter_date1 = d.toISOString().slice(0,10);

	d = new Date(curr.getFullYear() + 1, 0, 1);
	filter_date2 = d.toISOString().slice(0,10);

	filter_registration_open = '';
	filter_registration_date1 = '';
	filter_registration_date2 = '';

	filter_country_code = '';
	filter_club_type = '';
	filter_club_id = '';
	filter_course_id = '';
	filter_type = '';
	filter_my = '';

	list_from = 1;
	list_to = list_page_count;

	setFilters();
	showCompetitions3();
	setCountryList();
	setClubList();
	setCourseList();
	setTypeList();
	setDivisionList();
	setMyList();

	ChangeUrl();

}

function saveFilter()
{

	// document.getElementById("formSaveFilters").submit();

}

function filterDelete(filter_id)
{

	if(confirm("Do you want to delete the filter?"))
	{
		location.href = '/?u=competitions_all&delete_filter='+filter_id;

	}
}

function setView(view)
{
	filter_view = view;


	if(filter_view == 2)
	{
		if(document.getElementById("id_view"))
			document.getElementById("id_view").innerHTML = lang['list_view'];
		document.getElementById('competition_list2').style.display = 'block';
		document.getElementById('map-canvas').style.display = 'none';
	}
	else if(filter_view == 3)
	{
		if(document.getElementById("id_view"))
			document.getElementById("id_view").innerHTML = lang['map_view'];
		document.getElementById('competition_list2').style.display = 'none';
		document.getElementById('map-canvas').style.display = 'block';
	}
	else
	{
		if(document.getElementById("id_view"))
			document.getElementById("id_view").innerHTML = lang['grid_view'];
		document.getElementById('competition_list2').style.display = 'block';
		document.getElementById('map-canvas').style.display = 'none';
	}

	if(document.getElementById("id_view_grid_1"))
	{
		if(!filter_view || filter_view == 1)
		{
			document.getElementById("id_view_grid_1").hidden = false;
			document.getElementById("id_view_grid_2").hidden = true;
		}
		else
		{
			document.getElementById("id_view_grid_1").hidden = true;
			document.getElementById("id_view_grid_2").hidden = false;
		}

		if(filter_view == 2)
		{
			document.getElementById("id_view_list_1").hidden = false;
			document.getElementById("id_view_list_2").hidden = true;
		}
		else
		{
			document.getElementById("id_view_list_1").hidden = true;
			document.getElementById("id_view_list_2").hidden = false;
		}

		if(filter_view == 3)
		{
			document.getElementById("id_view_map_1").hidden = false;
			document.getElementById("id_view_map_2").hidden = true;
		}
		else
		{
			document.getElementById("id_view_map_1").hidden = true;
			document.getElementById("id_view_map_2").hidden = false;
		}
	}

	showCompetitions3();

	ChangeUrl();

}

function setSorting(name, order)
{
	filter_sort_name = name;
	filter_sort_order = order;

	list_from = 1;
	list_to = list_page_count;

	showCompetitions3();
	ChangeUrl();

}

$(function() {
	setTimeout(function() {
		$('.datepicker').hide();
	}, 125);
});
