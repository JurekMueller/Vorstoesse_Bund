// Code adapted from https://gist.github.com/colbenkharrl/dcb5590173931bb594e195020aaa959d

///////////// INITIAL SETUP ////////////////

//	svg selection and sizing
//  for some reason the bounding box does not properly work on the right and bottom
var svg = d3.select("#network-svg"),
    width = +svg.style("width").replace("px", "") - svg.style("border-width").replace("px", ""), // the + is casting a string to a number
    height = +svg.style("height").replace("px", "") - svg.style("border-width").replace("px", "");

// Add Legend
svg.append("g")
  .attr("class", "legend")
  .attr("transform", "translate(20,20)");

///////////// DOM CREATION ////////////////

///////////// DOM CREATION: Translation ////////////////

d3.select("#langSelectFr")
				.on('click',function() {translate('fr',node);});

d3.select("#langSelectDe")
				.on('click',function() {translate('de',node);});

let dictionary =   [{'id':'ratT',"translation":{'de':'Rat','fr':'Conseil'}},
					{'id':'legT',"translation":{'de':'Legislatur','fr':'Législature'}},
					{'id':'topT',"translation":{'de':'Thema','fr':'Sujet'}},
					{'id':'colT',"translation":{'de':'Farbe','fr':'Couleur'}},
					{'id':'linT',"translation":{'de':'Mindestanzahl Zusammenarbeiten','fr':'Nombre minimum de collaborations'}},
					{'id':'busT',"translation":{'de':'Art des Vorstosses','fr':"Type d'intervention"}},
					{'id':'cooT',"translation":{'de':'Zusammenarbeit','fr':'Coopération'}},
					{'id':'netT',"translation":{'de':'Netzwerkvisualisierung','fr':'Visualisation du réseau'}},
				 ]

var currentLang;

function translate(lang,nodes) {
	dictionary.forEach(function(d) {d3.select('#'+d.id).text(d.translation[lang])});
	vor_types.forEach(function(d) {d3.select('#'+d.id+'T').text(d[lang])});
	exint.forEach(function(d) {d3.select('#'+d.id+'T').text(d[lang])});
	rat_types.forEach(function(d) {d3.select('#ratSel'+d.id).text(d[lang])});
	colorDim.forEach(function(d) {d3.select('#colSel'+d).text(dictProperties[d][lang])});
	vor_subj.forEach(function(d) {d3.select('#subjSel'+d.de.replace(/\s/g, '')).text(d[lang])});
	currentLang = lang;
	if (typeof colors !== 'undefined') {
		updateColor();
	};

	if (typeof nodes !== 'undefined') {
	// Update title based on filtered number of lead vorstösse
	nodes.select('title').text(function(d) { 
		var party_trans;
		if (typeof dictParties[d.Partei] !== 'undefined') {
			party_trans = dictParties[d.Partei][lang];
		} else {party_trans = d.Partei;};
		return  dictProperties['Name'][lang]+": " + d.FirstName + ' ' + d.LastName + "\n" +
				dictProperties['Geschlecht'][lang]+": " + dictGender[d.Geschlecht][lang] + "\n" +
				dictProperties['Partei'][lang]+": " + party_trans + "\n" +
				dictProperties['Kanton'][lang]+": " + dictCantons[d.CantonName][lang] + "\n" +
				dictProperties['DienstjahreTot'][lang]+": " + d.DienstjahreTot.toFixed(2) + "\n" +
				dictProperties['DienstjahreLeg'][lang]+": " + d.DienstjahreLeg.toFixed(2) + "\n" +
				dictProperties['Vorstösse'][lang]+": " + d.Collab.length
				});
			};
};

///////////// DOM CREATION: RAT SELECT ////////////////
var selectRat;
let rat_types = [{'id':'Nat','de':'Nationalrat','fr':'Conseil national','value':1},
				{'id':'Sta','de':'Ständerat','fr':'Conseil des États','value':2}]

var legWrapper = d3.select("#ratSelect")
				.append("select")
				.attr("class","form-select")
				.on("change", function() {
					var val = this.options[this.selectedIndex].value;
					selectRat = val;
					d3.selectAll(".loader").style("visibility","visible");
					d3.selectAll(".overlay").style("visibility","visible");
					loadFiles();
				});

var legOption = legWrapper
				.selectAll(".color-option")
				.data(rat_types)
				.enter()
				.append("option")
				.attr("id",function(d) {return 'ratSel'+d.id})
				.attr("value",function(d) {return d.value});

selectRat = 2
d3.select('#ratSelSta').property('selected',true);
///////////// DOM CREATION: COLOR DIM SELECT ////////////////

//	colors for parties are picked to resemble oficcialy reported colors:
// https://statistik.tg.ch/themen-und-daten/staat-und-politik/wahlen-und-abstimmungen/grossratswahlen-2020-hauptseite.html/10545
// colors for service years were picked from a seaborn color palette (Purples_d)

// XXX Needs Change
// Only large parties get colors
let large_parties = ['FDP','FDP-Liberale','SVP','GRÜNE','glp','SP','CVP','EVP','BDP','M-E'];
var colors; // is set in loadFiles
var colorDim = ['Partei','Geschlecht','DienstjahreTot','DienstjahreLeg'];

let dictProperties = {'Partei':{'de':'Partei','fr':'Parti'},
				'Geschlecht':{'de':'Geschlecht','fr':'Sexe'},
				'DienstjahreTot':{'de':'Dienstjahre Total','fr':'Années de service Total'},
				'DienstjahreLeg':{'de':'Dienstjahre Legislatur','fr':'Années de service Législature'},
				'Name':{'de':'Name','fr':'Nom'},'Kanton':{'de':'Kanton','fr':'Canton'},
				'Vorstösse':{'de':'Vorstösse','fr':'Interventions'}};

let dictParties = {'FDP':{'de':'FDP','fr':'PRD'},'FDP-Liberale':{'de':'FDP-Liberale','fr':'PLR'},
				'SVP':{'de':'SVP','fr':'UDC'},'GRÜNE':{'de':'GRÜNE','fr':'Les Verts'},
				'glp':{'de':'glp','fr':'PVL'},'SP':{'de':'SP','fr':'PS'},
				'CVP':{'de':'CVP','fr':'PDC'},'EVP':{'de':'EVP','fr':'PEV'},
				'BDP':{'de':'BDP','fr':'PBD'},'M-E':{'de':'Die Mitte','fr':'Le Centre'},
				'Kleinparteien':{'de':'Kleinparteien','fr':'Petits partis'},
				'LPS':{'de':'LPS','fr':'PLS'},'CSP':{'de':'CSP','fr':'PCS'},
				'PdA':{'de':'PdA','fr':'PST'},'EDU':{'de':'EDU','fr':'UDF'},
				'SD':{'de':'SD','fr':'DS'}};

let dictCantons = {'Zürich':{'de':'Zürich','fr':'Zurich'},'Bern':{'de':'Bern','fr':'Berne'},
					'Luzern':{'de':'Luzern','fr':'Lucerne'},'Uri':{'de':'Uri','fr':'Uri'},
					'Schwyz':{'de':'Schwyz','fr':'Schwyz'},'Obwalden':{'de':'Obwalden','fr':'Obwald'},
					'Nidwalden':{'de':'Nidwalden','fr':'Nidwald'},'Glarus':{'de':'Glarus','fr':'Glaris'},
					'Zug':{'de':'Zug','fr':'Zoug'},'Freiburg':{'de':'Freiburg','fr':'Fribourg'},
					'Solothurn':{'de':'Solothurn','fr':'Soleure'},'Basel-Stadt':{'de':'Basel-Stadt','fr':'Bâle-Ville'},
					'Basel-Landschaft':{'de':'Basel-Landschaft','fr':'Bâle-Campagne'},
					'Schaffhausen':{'de':'Schaffhausen','fr':'Schaffhouse'},
					'Appenzell A.-Rh.':{'de':'Appenzell Ausserrhoden','fr':'Appenzell Rhodes-Extérieures'},
					'Appenzell I.-Rh.':{'de':'Appenzell Innerrhoden','fr':'Appenzell Rhodes-Intérieures'},
					'St. Gallen':{'de':'St. Gallen','fr':'Saint-Gall'},'Jura':{'de':'Jura','fr':'Jura'},
					'Graubünden':{'de':'Graubünden','fr':'Grisons'},'Aargau':{'de':'Aargau','fr':'Argovie'},
					'Thurgau':{'de':'Thurgau','fr':'Thurgovie'},'Tessin':{'de':'Tessin','fr':'Tessin'},
					'Waadt':{'de':'Waadt','fr':'Vaud'},'Wallis':{'de':'Wallis','fr':'Valais'},
					'Neuenburg':{'de':'Neuenburg','fr':'Neuchâtel'},'Genf':{'de':'Genf','fr':'Genève'},};

let dictGender = {'männlich':{'de':'männlich','fr':'masculin'},'weiblich':{'de':'weiblich','fr':'féminin'},}

let dictService = {'delim':{'de':'bis','fr':'à'},'less':{'de':'Weniger als','fr':'Moins de'},
					'more':{'de':'oder mehr','fr':'ou plus'},}

var colorWrapper = d3.select("#colorSelect")
			.append("select")
			.attr("class","form-select")
			.on("change", function() {
				var val = this.options[this.selectedIndex].value;
				selectColorDim = val;
				updateColor();
			});

var colorOption = colorWrapper
		.selectAll(".color-option")
		.data(colorDim)
		.enter()
		.append("option")
		.attr("id",function(d) {return 'colSel'+d})
		.attr("value",function(d) {return d})

// Select Partei as default
var selectColorDim = 'Partei';
d3.select('#colSelPartei').property('selected',true);

///////////// DOM CREATION: #LINK SELECT ////////////////

var linkMin = ['1','3','5','10','20','30','40','50','60','70','80','90','100']

var linkWrapper = d3.select("#linkSelect")
			.append("select")
			.attr("class","form-select")
			.attr("id",'linkSel')
			.on("change", function() {
				var val = this.options[this.selectedIndex].value;
				selectLinkMin = parseInt(val);
				d3.selectAll(".loader").style("visibility","visible");
				d3.selectAll(".overlay").style("visibility","visible");
				filterAll();
				update();
			});

var linkOption = linkWrapper
		.selectAll(".link-option")
		.data(linkMin)
		.enter()
		.append("option")
		.attr("id",function(d) {return 'linkSel'+d})
		.attr("value",function(d) {return d})
		.text(function(d) {return d})

// Select linkstrength of 3 as default
var selectLinkMin = 10
d3.select('#linkSel10').property('selected',true)

///////////// DOM CREATION: TYPE CHECKBOX FILTER ////////////////

// ['Motion','Parlamentarische Initiative','Postulat','Interpellation','Dringliche Interpellation','Fragestunde. Frage','Anfrage','Dringliche Anfrage']  
// checkboxes for type of vorstoss
var vor_types = [{id:"filtParlIni",de:"Parlamentarische Initiative", fr:'Initiatives parlementaire'},
				 {id:"filtMotion",de:"Motion", fr:'Motion'},				 
				 {id:"filtPostulat",de:"Postulat", fr:'Postulat'},
				 {id:"filtInterp",de:"Interpellation", fr:'Interpellation'},
				 {id:"filtAnfr",de:"Anfrage", fr:"Question"},
				 {id:"filtFragsFrage",de:"Fragestunde. Frage", fr:"Question de l'heure des questions"}];

var typeWrapper = d3.select("#typeCheckbox");

var typeButton = typeWrapper
        .selectAll(".form-check")
        .data(vor_types)
        .enter()
        .append("div")
        .attr("class", "form-check form-switch");
typeButton.append("input")
	.attr("type", "checkbox")
	.attr("id", function(d) { return d.id; })
	.attr("value", function(d) { return d.de; })
	.attr("class", "form-check-input")
	.property('checked',false)
	.on("click", function() {
		var val = $(this).attr("value");
		if (this.checked && typeFilterList.includes(val)) {
			// if val is in list remove it
			typeFilterList.splice(typeFilterList.indexOf(val), 1)
		} else if (!this.checked && !typeFilterList.includes(val)) {
			// if val not in list add it
			typeFilterList.push(val);
		}
		filterAll();
		update();
	});
typeButton.append("label")
    .attr('for', function(d) { return d.de; })
    .attr("class", "form-check-label")
	.attr('id',function(d) {return d.id+'T'});

///////////// DOM CREATION:  SUBJECT SELECT FILTER ////////////////

// checkboxes for type of vorstoss
var vor_subj;

var subjOption = d3.select("#subjectSelect")
				.append("select")
				.attr("class","form-select")
				.attr("id",'subjSel')
				.on("change", function() {
					var val = this.options[this.selectedIndex].value;
					filteredSubj = val;
					filterAll();
					update();
				});

///////////// DOM CREATION:  SUBJECT SELECT FILTER ////////////////

var exint = [{'id':'internal','de':'parteiintern', 'fr':'interne au parti'},
			{'id':'external','de':'parteiextern', 'fr':'hors parti'}]

var exintWrapper = d3.select("#exintCheckbox");

var exintButton = exintWrapper
		.selectAll(".form-check")
		.data(exint)
		.enter()
        .append("div")
        .attr("class", "form-check");
exintButton.append("input")
	.attr("type", "checkbox")
	.attr("value", function(d) { return d.id; })
	.attr("class", "form-check-input")
	.property('checked',true)
	.on("click", function() {
		var val = $(this).attr("value");
		if (this.checked && val == 'internal') {
			PartyConnections = true;
		} else if (!this.checked && val == 'internal') {
			PartyConnections = false;
		} else if (this.checked && val == 'external') {
			exPartyConnections = true;
		} else if (!this.checked && val == 'external') {
			exPartyConnections = false;
		}
		filterAll();
		update();
		});
exintButton.append("label")
    .attr('for', function(d) { return d.id; })
    .attr("class", "form-check-label")
	.attr("id", function(d) { return d.id + 'T'});


var PartyConnections = true;
var exPartyConnections = true;

///////////// FILTER FUNCTIONS ////////////////

// //	filtered types
// var typeFilterList = [];
var typeFilterList = vor_types.map(a => a.de);
// turn some on
d3.select('#filtMotion').property('checked',true);
typeFilterList.splice(typeFilterList.indexOf('Motion'), 1)
var filteredSubj = 'Alle Themen'; //
var links_store = [];
let maxLinks = 5000;
function filterAll() {
	console.log('Start',graph.links.length)
	var startTime = performance.now()
	repeat = false
	do {
		graph.links = [];
		for (let l of store.links) {
			for (let v of l.value) {
				// filter for Subject
				if (filteredSubj==='Alle Themen') {
					v.unselected = false;
				// If select != all narrow selection
				} else if (!v.Thema.includes(filteredSubj)) {
					v.unselected = true;
				} else {
					v.unselected = false;
				};
				// filter for type
				if (!typeFilterList.includes(v.Type)) {
					v.filtered = false;
				} else {
					v.filtered = true;
				};
			};
			let vFiltered = l.value.filter(x => x.unselected===false && x.filtered===false);
			// only include if number off collaborations is larger than the minimum
			
			if (vFiltered.length>=selectLinkMin &&
				(l.sameParty===false || PartyConnections===true) &&
				(l.sameParty===true || exPartyConnections===true)) {
				graph.links.push($.extend(true, {}, l));
				graph.links.at(-1).value = vFiltered;
			};
		};
		console.log('End',graph.links.length)
		if (graph.links.length > maxLinks && selectLinkMin != 100) {
			if (selectLinkMin === 1) selectLinkMin += 2;
			else if (selectLinkMin === 3) selectLinkMin += 2;
			else if (selectLinkMin === 5) selectLinkMin += 5;
			else selectLinkMin += 10;
			d3.select('#linkSel'+selectLinkMin.toString()).property('selected',true)
			repeat = true;
		} else {
			repeat = false;
		};
    } while (repeat)

	graph.nodes = [];
	for (let n of store.nodes) {
		for (let v of n.Collab) {
			// filter for Subject
			if (filteredSubj==='Alle Themen') {
				v.unselected = false;
			// If select != all narrow selection
			} else if (!v.Thema.includes(filteredSubj)) {
				v.unselected = true;
			} else {
				v.unselected = false;
			};
			// filter for type
			if (!typeFilterList.includes(v.Type)) {
				v.filtered = false;
			} else {
				v.filtered = true;
			};
		};
		let vFiltered = n.Collab.filter(x => x.unselected===false && x.filtered===false);
		graph.nodes.push($.extend(true, {}, n));
		graph.nodes.at(-1).Collab = vFiltered;
	};
	var endTime = performance.now()
	console.log(`Call to filterAll took ${endTime - startTime} milliseconds`);
};

///////////// SIMULATION SETUP ////////////////

//	force simulation initialization
var simulation = d3.forceSimulation()
	.force("link", d3.forceLink()
		.id(function(d) { return d.id; })) // why id?
		// .id()) // why id?
	.force("charge", d3.forceManyBody()
		// .strength(-65))
		.strength(d => charge_strength(d)))
	// // .force("center", d3.forceCenter(width / 2, height / 2))
	// // applying forceX and forceY instead of center leads to a more even distribution
	.force("x", d3.forceX(width / 2)
		.strength(d => center_strength_x(d)))
    .force("y", d3.forceY(height / 2)
		.strength(d => center_strength_y(d)))
	.force("circular", d3.forceRadial(250,width / 2, height / 2)
	 	.strength(d => circular_strength(d)))
	.force("collide", d3.forceCollide()
		.radius(radius)
		.strength(0.5))
	.on("tick", ticked)
	.velocityDecay(0.1);
	// .alphaDecay(0.02);

//	tick event handler with bounded box
//  I think tick event happens every timestep
function ticked() {
	// keeps nodes within svg boundaries
	node
		.attr("cx", function(d) { return d.x = Math.max(radius(d), Math.min(width - radius(d), d.x)); })
		.attr("cy", function(d) { return d.y = Math.max(radius(d), Math.min(height - radius(d), d.y)); });
	// positions link line between source and target how?
	link
		.attr("x1", function(d) { return d.source.x; })
		.attr("y1", function(d) { return d.source.y; })
		.attr("x2", function(d) { return d.target.x; })
		.attr("y2", function(d) { return d.target.y; });
}

///////////// DOM CREATION: LEG SELECT ////////////////
let legislatures;
var selectLeg;

var legWrapper = d3.select("#legSelect")
				.append("select")
				.attr("class","form-select")
				.on("change", function() {
					var val = this.options[this.selectedIndex].value;
					selectLeg = val;
					d3.selectAll(".loader").style("visibility","visible");
					d3.selectAll(".overlay").style("visibility","visible");
					loadFiles();
				});


///////////// DATA READIN ////////////////

//	data stores
// store holds all nodes, graph only the ones visualised
var graph, store;

// node and link hold the DOMs
var link = svg.append("g").selectAll(".link"),
	node = svg.append("g").selectAll(".node");

// this starts the code..
d3.json("../Data/legislatures.json").then(function(l) {
	legislatures = l;

	var legOption = legWrapper
			.selectAll(".leg-option")
			.data(legislatures)
			.enter()
			.append("option")
			.attr("id",function(d) {return 'legSel'+d.ID})
			.attr("value",function(d) {return d.ID})
			.attr("class", d => "leg-option")
			.text(d => d.ID + ': ' + d.StartDate + '-' + d.EndDate);

	// Select Partei as default
	// selectLeg = legislatures.at(-1).ID.toString();
	selectLeg = '47'
	d3.select('#legSel'+selectLeg).property('selected',true);
	d3.selectAll(".loader").style("visibility","visible");
	d3.selectAll(".overlay").style("visibility","visible");
	loadFiles();
});


////////// FUNCTION DEFINITIONS ////////////

function loadFiles() {
	d3.json("../Data/topics.json").then(function(s) {
		// vor_subjects.push(s)
		vor_subj = $.extend(true, s, {});
		// DOM creation for subj Selector
		subjOption = subjOption
					.selectAll(".subj-option")
					.data(vor_subj);
			
				
		newSubjOption = subjOption.enter()
				.append("option")
				.attr("id",function(d) {return "subjSel"+d.de.replace(/\s/g, '')})
				.attr("value",function(d) {return d.de})
		translate('de'); // translate after all doms have been created
		
		//	data read and store
		d3.json("../Data/netzwerk_"+selectLeg+"_"+selectRat+".json").then(function(g) {
		// d3.json("../Data/netzwerk_47.json").then(function(g) {
			// if (err) throw err;
			// // adds ID for links
			// Fill Text with standard lang
			g.links.forEach(function(l,idx) {
				l.id = idx;
			});
			graph = g;
			//the $ sign is used to acess jQuery functions
			// the extend function merges two objects. As the target is empty and deep is true,
			// this is basically just a deep copy of the array.
			store = $.extend(true, {}, g);

			// Change colorspace depending of Parties present
			colors={
				'Partei':{'SP':'#cd3700','GRÜNE':'#a2c510','glp':'#b3ee3a','CVP':'#e39e00','M-E':'#e39e00',
				'EVP':'#00b4e8','FDP':'#0064e6','FDP-Liberale':'#0064e6','SVP':'#3ca433','BDP':'#ffed00','Kleinparteien':'#a5b7d4'},
				'Geschlecht':{'weiblich':d3.schemeTableau10[0],'männlich':d3.schemeTableau10[1]}
				};
			let partiesLeg = Array.from(new Set(store.nodes.map(item => item.Partei))); // find unique Party Abbreviation
			for (let c of Object.keys(colors['Partei'])) {
				if (c!='Kleinparteien' && !partiesLeg.includes(c)) delete colors['Partei'][c];
			}
			// reset DOMs
			// node = node.data([], function(d) { return d.id;});
			// //	EXIT
			// node.exit().remove();
			filterAll();
			update();

		});
		
	});
}

///////////// UPDATE FUNKTION ////////////////

//	general update pattern for updating the graph
function update() {
	var startTime = performance.now()
	//	UPDATE
	// The key function gives binds data to a specific DOM (e.g. not just the first one), I think...
	node = node.data(graph.nodes, function(d) { return d.id;});
	// node = svg.selectAll(".node");
	//	EXIT
	node.exit().remove();
	//	ENTER
	var newNode = node.enter().append("circle")
		.attr("class", "node")
		// This adds drag listeners to the nodes
		.call(d3.drag()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended)
        );

    newNode.append("title");
	
	//	ENTER + UPDATE
	
	// Update radius and color
	node = node.merge(newNode)
			.attr("r", radius)
	
	translate(currentLang,nodes = node)

	// Update color
	updateColor();

	//	UPDATE
	link = link.data(graph.links, function(d) { return d.id;});
	//	EXIT
	link.exit().remove();
	//	ENTER
	newLink = link.enter().append("line")
		.attr("class", "link");

	newLink.append("title");
	//	ENTER + UPDATE
	link = link.merge(newLink)
	  .attr("stroke-width",function(d) {
			if (d.value.length>=selectLinkMin) {  
				return d.value.length/20;
			} else {
				return 0;	
			}
		});

	//	update simulation nodes, links, and alpha
	simulation
		.nodes(graph.nodes);
		// I think this could also be at simulation declaration why
  	simulation.force("link")
  		.links(graph.links)
		// Use the standard function but turn off if value is empty
		.strength(function(d) {
			if (d.value.length >= selectLinkMin) {
				return 1/(2*Math.min(count(d.source),count(d.target)));
			} else {
				return 0;
			}
		})
		// .distance(function(d) {return Math.max(d.value.length*8,50);});

  	// alpha is basically the "strength" or "temperature" of the simulation.
	// It decays over time. If it reaches 0 the simulation stops.
	// Default values are alpha=1 alphaTarget=0
	simulation.alpha(1).alphaTarget(0).restart();

	// // continue UPDATE (only when simulation is running the links have access to the source/target node)
	// link.select('title').text(function(d) { 
	// 	let commonVor = '';
	// 	d.value.forEach(v => commonVor = commonVor + v.Name + '\n');
	// 	return d.source.Name + ' ('+ d.source.Partei + ')' + " - " + d.target.Name + ' ('+ d.target.Partei + ')' + "\n" +
	// 	"Gemeinsame Vorstösse ("+ d.value.length +"):\n" +
	// 	commonVor;
	// });
	var endTime = performance.now()
	console.log(`Call to update took ${endTime - startTime} milliseconds`)

	d3.selectAll(".loader").style("visibility","hidden");
	d3.selectAll(".overlay").style("visibility","hidden");
};

function updateColor() {
	var colorScale;
	if (selectColorDim==='DienstjahreTot') {
		colorScale = d3.scaleThreshold()
				.domain([4,8,12,16,20])
				.range(d3.schemePurples[6]);
	} else if (selectColorDim==='DienstjahreLeg') {
		colorScale = d3.scaleThreshold()
				.domain([1,2,3,4])
				.range(d3.schemePurples[5]);
	} else {
		colorScale = d3.scaleOrdinal()
				.domain(Object.keys(colors[selectColorDim]))
				.range(Object.values(colors[selectColorDim]));
	}
	var legend = d3.legendColor()
					.shape("path", d3.symbol().type(d3.symbolCircle).size(150)())
					.shapePadding(10)
					.scale(colorScale)
	if (selectColorDim.includes('Dienstjahre')) {
			legend
				.labelDelimiter(dictService['delim'][currentLang])
				.labels(thresholdLabel)
				.labelFormat(d3.format(".0f"));
	} else if (selectColorDim.includes('Partei')) {
			legend
				.labels(partyLabel)
	} else if (selectColorDim.includes('Geschlecht')) {
		legend
			.labels(genderLabel)
}
	node.attr("fill", function(d) {
				if (selectColorDim==='Partei' &&
				!large_parties.includes(d[selectColorDim]) ) {
					return colors[selectColorDim]['Kleinparteien'];}
				else if (selectColorDim.includes('Dienstjahre')) return colorScale(d[selectColorDim]);
				else return colors[selectColorDim][d[selectColorDim]];
			});
	svg.select(".legend")
		.call(legend);
}

///////////// DRAGGING ////////////////

//	drag event handlers
// why. might be rewritten by passing event
function dragstarted(event,d) {
	// event.active indicates how many other drag events are active (e.g. on multitouch)
	// if this is the only one event.active = 0
	// This part prevents the simulation from restarting if it is not the first drag event.
	if (!event.active) simulation.alphaTarget(0.1).restart();
	// fx and fy are fixed positions (not subject to forces)
	d.fx = d.x;
	d.fy = d.y;
}

function dragged(event,d) {
	d.fx = event.x;
	d.fy = event.y;
}

function dragended(event,d) {
	// This part prevents the simulation from stopping if it is not the last drag event.
	if (!event.active) simulation.alphaTarget(0);
	d.fx = null;
	d.fy = null;
}

///////////// HELPER FUNCTIONS ////////////////

function radius(abg) {
	if (abg.Collab.length === 0) {
		return 2.5;
	} else {
		return abg.Collab.length/20+2.5;
	};
}

function count(d) {
	return link.filter(function(l) {
		return l.source.index == d.index || l.target.index == d.index
	  }).size();
}

function center_strength_y(d) {
	if (d.Collab.length===0) {
		return 0.05;
	} else {
		return 0.13;
	}
}

function center_strength_x(d) {
	if (d.Collab.length===0) {
		return 0.025;
	} else {
		return 0.1;
	}
}

function circular_strength(d) {
	if (d.Collab.length===0) {
		return 0.15;
	} else {
		return 0;
	}
}

function charge_strength(d) {
	if (d.Collab.length===0) {
		return Math.min(-1 * radius(d)**1.8,-40)*1.6;
	} else {
		return Math.max(Math.min(-1 * radius(d)**1.8,-40),-250);
	}
}

function thresholdLabel( {
	i,
	genLength,
	generatedLabels,
	labelDelimiter
  }) {
	if (i === 0) {
	  const values = generatedLabels[i].split(` ${labelDelimiter} `)
	  return dictService['less'][currentLang] + ` ${values[1]}`
	} else if (i === genLength - 1) {
	  const values = generatedLabels[i].split(` ${labelDelimiter} `)
	  return `${values[0]}` + dictService['more'][currentLang]
	}
	return generatedLabels[i]
  }  

function partyLabel( {
	i,
	generatedLabels,
  }) {
	return dictParties[generatedLabels[i]][currentLang]
  }

function genderLabel( {
	i,
	generatedLabels,
  }) {
	return dictGender[generatedLabels[i]][currentLang]
  }