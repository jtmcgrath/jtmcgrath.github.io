(function( jmPortfolio, $, undefined ) {
	articleTimeout = '';
	
	jmPortfolio.hideSplash = function () {
		setTimeout(function() {$('#splash').fadeOut(400,function() {$('#splash').remove();});}, 500);
	}
	
	jmPortfolio.loadDocument = function ( documentId ) {
		// do nothing if target is current document
		if (documentId === window.location.pathname.replace(/\//g,'') && !jmPortfolio.loadarticlePopstate && !jmPortfolio.initialLoad) {
			return;
		}
		
		// catch error if target document does not exist
		if (typeof jmPortfolio.documents[documentId] === 'undefined') {
			documentId = '404';
		}
		
		// if a document is already loaded, hide the current document and set timeout to load target document
		if (typeof jmPortfolio.documents[window.location.pathname.replace(/\//g,'')] !== 'undefined') {
			jmPortfolio.hideDocument(false, true);
			setTimeout(function() {jmPortfolio.showDocument(documentId)}, 600);
		// if not, load target document
		} else {
			jmPortfolio.showDocument(documentId);
		}
	};
	
	jmPortfolio.showDocument = function( documentId ) {
		// get the document via ajax if it has not been preloaded
		jmPortfolio.getDocument(documentId);
		
		// manage animation timeout and active class
		clearTimeout(jmPortfolio.animateTimeout);
		jmPortfolio.animateTimeout = setTimeout(function() {$('#current-article').css({'overflow-y': 'scroll'})},100);
		$('.article-list').find('article.active').removeClass('active');
		
		// define the starting co-ordinates of the showDocument animation
		if (jmPortfolio.documents[documentId].type === 'project') {
			var rect = $('#'+documentId)[0].getBoundingClientRect();
		} else {
			var rect = {'top': '100%', 'left': 0, 'height': '100%', 'width': '100%'};
		} 
		
		// insert the loading gif if the target document has not been preloaded
		if (jmPortfolio.documents[documentId].preloaded) {
			var closeArticle = '</article>';
		} else {
			var closeArticle = '<img id="loading" src="/images/loading.gif" alt="" /></article>';
		}
		
		// disable transitions, reposition the document wrapper, and insert the document content
		$('#current-article').addClass('notransition').css({'top': rect.top, 'left': rect.left, 'height': rect.height, 'width': rect.width}).html('<article>'+jmPortfolio.documents[documentId].content+closeArticle);
		
		// force element refresh, then activate transitions
		$('#current-article').show()[0].offsetHeight;
		$('#current-article').removeClass('notransition').addClass('active');
		$('.content-wrapper').addClass('active');
		
		if (documentId !== '404') {jmPortfolio.updateHistory(documentId);}
		
		if (jmPortfolio.initialLoad) {
			jmPortfolio.hideSplash();
			jmPortfolio.initialLoad = false;
		}
	};
	
	jmPortfolio.hideDocument = function( pushState, freezeControls ) {
		$('#current-article').css({'overflow-y': 'hidden'}).removeClass('active').stop().animate({scrollTop:0}, '50', 'swing');
		$('.article-list').find('article.active').removeClass('active');
		if (!freezeControls) {$('.content-wrapper').removeClass('active');}
		clearTimeout(jmPortfolio.animateTimeout);
		jmPortfolio.animateTimeout = setTimeout(function() {$('#current-article').hide().html('');}, 500);
		if (pushState) {window.history.pushState(null, null, '/');}
	};
	
	jmPortfolio.getDocument = function( documentId ) {
		// get the document via ajax if it has not been preloaded
		if (!jmPortfolio.documents[documentId].preloaded) {
			$.ajax({
				url: "/content/"+documentId+".html",
				success: function(result) {
					// set preload to true
					jmPortfolio.documents[documentId].preloaded = true;
					
					if (jmPortfolio.documents[documentId].type === 'project') {
						result = '<section>'+result+'</section>';
					}
					
					jmPortfolio.documents[documentId].content = jmPortfolio.documents[documentId].content+result;
					
					// replace loading icon with result
					if ($('#loading').length) {
						$('#loading').replaceWith(result);
					}
				}
			});
		}
	};
	
	jmPortfolio.updateHistory = function( documentId ) {
		if (typeof jmPortfolio.loadarticlePopstate === 'undefined' || jmPortfolio.loadarticlePopstate === false) {
			window.history.pushState(null, null, documentId);
			if (jmPortfolio.documents[documentId].type === 'project') {$('#'+documentId).parent('article').addClass('active');}
		} else {jmPortfolio.loadarticlePopstate = false;}
	}
}( window.jmPortfolio = window.jmPortfolio || {}, jQuery ));

$(document).ready(function() {
	$('.article-list, .page-header').on('click loaddocument', 'a', function(event) {
		event.preventDefault();
		jmPortfolio.loadDocument(event.currentTarget.pathname.replace(/\//g,''));
	});
	
	$('#current-article').on('click', 'article > span', function(event) {
		event.preventDefault();
		jmPortfolio.hideDocument(true, false);
	});
	
	$('#controls-close').on('click', function(event) {
		event.preventDefault();
		jmPortfolio.hideDocument(true, false);
	});


	$('.content-wrapper').scroll(function() {
		var menu_height = parseInt($('.page-header p').height());
		var menu_scroll = jQuery('.content-wrapper').scrollTop();
		if (menu_height < menu_scroll && !$('.page-header').hasClass('minimise')) {
			$('.page-header').addClass('minimise');
		} else if (menu_height > menu_scroll && $('.page-header').hasClass('minimise')) {
			$('.page-header').removeClass('minimise');
		}
	});
	
	
	$.ajax({
		'async': false,
		'global': false,
		'url': '/content/_index.html',
		'dataType': "json",
		'success': function (data) {
			jmPortfolio.documents = data;
	
			var jmPortfolioPages = jmPortfolioProjects = '';
			
			// Iterate through array
			$.each(jmPortfolio.documents, function(id, data) {
				// Construct menu
				if (data.type === 'page') {
					jmPortfolioPages += "<li id='" + id + "'><a href=\"" + id + '">' + data.title + "</a></li>";
				};
				
				// Construct project list & project content
				if (data.type === 'project') {
					jmPortfolioProjects += '<article id="' + id + '"><a href="/' + id + '"><span><img src="/images/' + id + '.' + data.imagetype + '" height="188px" width="280px" /></span><header><h1>' + data.title + '</h1><h2>' + data.subtitle + '</h2></header></a></article>';
					
					var content = '';
					content += '<article><span><img src="/images/' + id + '.' + data.imagetype + '" height="188px" width="280px" /></span><header><h1>' + data.title;
					if (typeof data.url !== 'undefined' && data.url !== '') {content += ' <a class="visit-project" href="' + data.url + '" target="_blank">Visit ' + data.title + '</a>';}
					content += '</h1><h2>' + data.subtitle + '</h2></header></article>';
					
					jmPortfolio.documents[id].content = content;
				};
			});
			
			// Insert menu and project list
			$('.page-header').find('ul').prepend(jmPortfolioPages);
			$('.article-list').prepend(jmPortfolioProjects);
			
			// Load page if necessary
			if (window.location.pathname !== '/') {
				jmPortfolio.initialLoad = true;
				jmPortfolio.loadDocument(window.location.pathname.replace(/\//g,''));
			} else {
				jmPortfolio.hideSplash();
			}
		}
	});
});

window.addEventListener('popstate', function(event) {
	if (typeof jmPortfolio.documents[event.target.location.pathname.replace(/\//g,'')] === 'undefined') {
		jmPortfolio.hideDocument(false, false);
	} else {
		jmPortfolio.loadarticlePopstate = true;
		$('#'+event.target.location.pathname.replace(/\//g,'')+' a').trigger('loaddocument');
	}
});