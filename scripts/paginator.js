(function() {
	"use strict";
	var $ = App.$;
	var pageInfo = $('pageInfo');
	var fetchData = App.fetchData;

	var paginator = {
		totalPages: 0,
		currentPage: 0,
		pagesize: 100,
		totalResults: 0,
		uri:'http://localhost/elastic/places/_search?size={0}&from={1}',
		init: function(){

			App.addevent($("pagePrev"),"click",function(ev){
				ev.stopPropagation();
				if (paginator.currentPage > 1) {
					paginator.currentPage--;
					fetchData();
				}

				return false;
			})

			App.addevent($("pageNext"),"click",function(ev){
				ev.stopPropagation();
				if (paginator.currentPage < paginator.totalPages) {
					paginator.currentPage++;
					fetchData();
				}

				return false;
			});

			App.fetchData();

		},
		getUri:function()
		{
			var from = 0;
			if(paginator.currentPage > 1)
			{
				from = (paginator.currentPage - 1) *  paginator.pagesize
			}
			
			return paginator.uri.replace("{0}",paginator.pagesize).replace('{1}',from);
		},
		configure: function(totalResults){
			paginator.totalPages = Math.ceil(totalResults / paginator.pagesize);
			paginator.totalResults = totalResults;
			if(totalResults > 0)
			{
				if(paginator.currentPage == 0)
				{
					paginator.currentPage =1;
				}
			}
			paginator.setUI();
		},
		reset: function(totalResults){
			paginator.totalPages = 0;
			paginator.currentPage = 0;
			paginator.setUI();

		},
		setUI: function(){
			if (paginator.totalPages < 1) {
				pageInfo.innerHTML = " No results found";
			}
			else {
				var from = ((paginator.currentPage - 1) * paginator.pagesize) + 1;
				var to =  from + paginator.pagesize - 1;
				if(to > paginator.totalResults)
				{
					to = paginator.totalResults;
				}
				pageInfo.innerHTML = "Displaying " + from  + " - " + to + " of " + paginator.totalResults;
			}
		}
	}


	App.paginator = paginator;

}());

