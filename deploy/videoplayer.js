
$.fn.makeVideo = function( o ) {
	var $this = $(this);
	if (o.videoURL == null) return;
	o.videoProtocol = o.videoURL.substr(0,4);
	if (o.branded) $this.addClass("branded");
	
	o.shareURL = function() {
		var h = document.location.href;
		var hc = h.indexOf("#") > 0 ? h.replace( h.substring(h.indexOf("#")), "") : h;
		var shareURL = hc + "#" + playerID;
		return shareURL;
	}
	
	//console.log(o);
	var playerID = "vid_"+o.elementID;
	var isiDevice = (/iPad|iPhone|iPod/i.test(navigator.userAgent));
	
	var siteKeys = [
		{ "site" : "creativelift.net", 		"fpkey" : "#@905cc47e8164939b12d" },
		{ "site" : "unionbank.com", 		"fpkey" : "#@0fe097db9d8cebcca91" },
		{ "site" : "uboc.com", 				"fpkey" : "#@ed7621c5ad8cbbd051e" },
		{ "site" : "highmarkcapital.com", 	"fpkey" : "#@6f32f5dac6c63c08df5" },
		{ "site" : "unionbankcareers.com", 	"fpkey" : "#@762506d39a168884c9b" }
	];
	
	//function that is called on every track-worthy video player event
	var vidtrack = function( e ) {
		$(".debug_text").each( function(i,v){
			var c = $(this).text();
			var t = new Date().getTime().toString() + " >> " + o.elementID + " >> " + e + "\n";
			var cc = c + t;
			$(this).text(cc);
		});
	};
	
	vidtrack("isiDevice : " + isiDevice);


	//determine key
	var playerKey = function(){
		for( i in siteKeys ) {
			if ( RegExp(siteKeys[i].site, "i").test(document.location.hostname) ) return siteKeys[i].fpkey;
		}
		return "#@905cc47e8164939b12d"; //default key
	}

	$this.append(
		$('<a>', {
			"href" : o.videoURL,
			"id" : playerID,
			"name" : playerID,
			"class" : "video_player"
		}).css({
			"display" : "block",
			"width" : o.width,
			"height" : o.height
		})
	);
	
	if(o.sharebar) {
		$this.append(
			$('<div>', {
				"class" : "overlay"
			}).css({
				"width" : o.width - 20,
				"height" : isiDevice ? "" : o.height
				}).append(
					$('<a>', {
						"href" : "#",
						"text" : "CLOSE",
						"class" : "close"
					}),
					$('<h1>', {
						"text" : "HEADLINE"
					}),
					$('<textarea>', {
						"rows" : "",
						"cols" : ""
					}).css({
						"display" : "block",
						"width" : o.width - 60,
						"height" : 60,
						"margin" : 0
					}),
					$('<div>', {
						"class" : "content"
					})
			)
		);
		
		$this.append(
			$('<div>', {
				"class" : "share_bar" 
			}).css({
				"width" : o.width
				}).append(
					$("<a>", {
						"href" : o.logoLink,
						"class" : "logo"
					}),
					$('<a>', {
						"href" : "#",
						"text" : "EMBED",
						"class" : "button embed"
					}),
					$('<a>', {
						"href" : "#",
						"text" : "SHARE",
						"class" : "button share"
					}),
					$("<div>", {
						"class" : "addthis_toolbox addthis_default_style addthis_16x16_style",
						"addthis:url" : o.shareURL(),
						"addthis:title" : o.shareTitle,
						"addthis:description" : " "
					})
				)
		);
		
		$.each(["facebook","twitter","linkedin"], function(i,v) {
			$(".addthis_toolbox", $this).append(
				$("<a>", {
					"class" : "addthis_button_"+v
				})
			)
		})
	}
	//simplify some sub-components for use later in script
	var ol = $(".overlay", $this);
	var sb = $(".share_bar", $this);
	
	
	//adjust some parameters on sub-components if on iOS device
	if(isiDevice) {
		$(".share_bar, .overlay", $this).addClass("iOS");
		ol.insertAfter(sb);
		$(".close", ol).insertAfter( $(".content", ol) );
		ol.css({
		//	"height" : "auto"
		});
		
	}
	
	var playerClipOptions = {
		provider : o.videoProtocol,
		ipadUrl : o.mobileVideoURL,
		autoPlay : o.autoPlay,
		autoBuffering : true,
		bufferLength : 10,
		onStart: function(c) { 
			if (o.autoPlay) vidtrack("play");
			if (isiDevice) {
				this.getTime() < .5 ? vidtrack("play") : vidtrack("resume")
			}
		},
		onSeek: function(c,t) { 
			vidtrack("seek_"+t); 
		},
		onBeforeBegin: function(c) { 
		},
		onMetaData: function(c, e){ 
			if ( c._cuepoints == undefined ) {
				var cc=c;
				var fd = c.duration;
				var cues = [
					{ time:fd*.25*c.cuepointMultiplier, name: "25%" }, 
					{ time:fd*.5*c.cuepointMultiplier, name: "50%" }, 
					{ time:fd*.75*c.cuepointMultiplier, name: "75%" }
				];

				c.onCuepoint(
					// each integer represents milliseconds in the timeline
					cues,
					// this function is triggered when a cuepoint is reached
					function(clip, cuepoint) {
						vidtrack("progress_"+cuepoint.name);
					}
				 );
			}
		},
		onBegin: function(c) { 
		},
		onStop: function(c) { 
			vidtrack("stop"); 
		},
		onResume: function(c) { 
			this.getTime() < .5 ? vidtrack("play") : vidtrack("resume")
		},
		onPause: function() { 
			if (this.getTime() > 1) vidtrack("pause");
		},
		onFinish: function(c) {
			vidtrack("finish");
		}
	};
	
	var playerPluginOptions = {
		controls: {
			url : "flowplayer.controls-3.2.5.swf",
			fullscreen : true,
			bottom: 0,
			autoHide: "always"
		}
	};
	
	if (o.videoProtocol == "rtmp") {
		// here is our rtpm plugin configuration
		playerPluginOptions.akamai = { url: '../flowplayer.akamai-3.2.0.swf' },
		playerPluginOptions.rtmp = { url: '../flowplayer.rtmp-3.2.3.swf' }
	};
	
	var playerLogoOptions = {
		// default logo and its position, relative to video SWF
		url: 'deploy/img/video_logo.png',
		top: 10,
		right: 15,
		opacity: 0.4,

		// for SWF-based logos you can supply a relative size (to make the logo larger in fullscreen)
		// width: '6.5%',
		// height: '6.5%',

		// if set to false, then the logo is also shown in non-fullscreen mode
		fullscreenOnly: false,

		// time to display logo (in seconds). 0 = show forever
		displayTime: 0,

		/*
			if displayTime > 0 then this specifies the time it will take for
			the logo to fade out. this happens internally by changing the opacity
			property from its initial value to full transparency.
			value is given in milliseconds.
		*/
		fadeSpeed: 0

	};
	
	// for commercial versions you can specify where the user is redirected when the logo is clicked
	if (o.logoLink) playerLogoOptions.linkUrl = o.logoLink;
	
	
	$(".share_bar a.button", $this).bind("click", function(e){
		e.preventDefault();
		//reset
		$(".overlay .content", $this).html("");
		
		if ( $(this).hasClass("embed") ) {
			// get the embedding code
			var code = $f(playerID).embed().getEmbedCode();

			$(".overlay h1").text("Embed this video:");
			$(".overlay textarea", $this).html( code );
		}
		
		if ( $(this).hasClass("share") ) {
			var h = document.location.href;
			var hc = h.indexOf("#") > 0 ? h.replace( h.substring(h.indexOf("#")), "") : h;
			var shareURL = hc + "#" + playerID;
			
			$(".overlay h1").text("Link to this video:");
			$(".overlay textarea", $this).html( shareURL );
			$.each(["facebook","twitter","linkedin"], function(i,v) {
				$(".addthis_toolbox", $this).append(
					$("<a>", {
						"class" : "addthis_button_"+v
					})
				)
			})			
			addthis.toolbox( $(".addthis_toolbox", $this).get(0), {}, { "url" : shareURL });
		}
		
		if ( $(this).hasClass("engaged") ) {
			$(".share_bar a", $this).removeClass("engaged");
			$(".overlay", $this).slideUp();
		} else {
			$(".share_bar a", $this).removeClass("engaged");
			$(this).addClass("engaged");
			$(".overlay .embed_text", $this).show();
			$(".overlay", $this).slideDown();
		}
	});
	
	$(".overlay .close", $this).bind("click", function(e){
		e.preventDefault();
		$("a", sb).removeClass("engaged");
		ol.slideUp();
	});
	
	$f(playerID, {src: "../flowplayer.commercial-3.2.7.swf", wmode: "transparent"}, {
	
		// log: { level: 'debug'//, filter: 'org.flowplayer.akamai.*, org.flowplayer.rtmp.*'
		// 				},
	
		// commercial version requires product key
		key: playerKey(),
	
		/*
			logo can a JPG, PNG or SWF file.
			NOTE: the logo can only be changed in commercial versions
			the url must be absolute or relative to the flowplayer SWF
		*/
		logo: o.branded ? playerLogoOptions : {},
		
		//player-level events
		onLoad: function(c) { 
			vidtrack("loaded");
			var cc=this.getClip(0);
		},
		onMute: function() { 
			if (this.isLoaded()) vidtrack("mute");
		},
		onUnmute: function() { 
			vidtrack("unmute"); 
		},
		onFullscreenExit: function() { 
			vidtrack("fullscreen_exit");
		},
		onFullscreen: function() { 
			vidtrack("fullscreen");
		},
		onVolume: function(level) { 
			vidtrack("volume_"+level);
		},
	
		clip: playerClipOptions,
		plugins: playerPluginOptions
	}).ipad(); //{simulateiDevice: true}
	
	return $f(playerID);
};