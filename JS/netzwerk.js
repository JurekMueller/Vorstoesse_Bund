// Code adapted from https://gist.github.com/colbenkharrl/dcb5590173931bb594e195020aaa959d

//// Last changed

let dateWeb = '16.03.2023'
let dateData = '17.04.2023'

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

///////////// DOM CREATION:  STORY FILTER ////////////////

function storyFilter(leg=selectLeg,rat=selectRat,linkStrength=20,subj='Alle Themen',color='Partei',typeFilter='Default',intern=true,extern=true) {
	if (typeFilter==='Default') {
		typeFilter = vorTypes.map(a => a.de);
		typeFilter.splice(typeFilter.indexOf('Motion'), 1);
	} else if (typeFilter==='All') {
		typeFilter=[]
	} else if (typeFilter==='Gesetze') {
		typeFilter=['Interpellation','Anfrage','Fragestunde. Frage'] // filtered out
	} else if (typeFilter==='Anfragen') {
		typeFilter=['Motion','Parlamentarische Initiative','Postulat']
	}
	typeFilterList = typeFilter;
	vorTypes.forEach(d => typeFilter.includes(d.de) ? d3.select('#'+d.id).property('checked',false) : d3.select('#'+d.id).property('checked',true));
	
	selectLinkMin = linkStrength;
	d3.select('#linkSel'+selectLinkMin).property('selected',true);
	
	filteredSubj = subj;
	d3.select('#subjSel'+filteredSubj.replace(/\s/g, '')).property('selected',true);
	
	selectColorDim = color;
	d3.select('#colSel'+selectColorDim).property('selected',true);

	PartyConnections = intern;
	d3.select('#internal').property('checked',PartyConnections);

	exPartyConnections = extern;
	d3.select('#external').property('checked',exPartyConnections);

	if (leg !== selectLeg || rat!==selectRat) {
		selectLeg = leg;
		d3.select('#legSel'+selectLeg).property('selected',true);

		selectRat = rat;
		d3.select('#ratSel'+ratTypes.find(d => { return d.value===rat }).id).property('selected',true);
		
		d3.selectAll(".loader").style("visibility","visible");
		d3.selectAll(".overlay").style("visibility","visible");
		loadFiles();
	} else {
		filterAll();
		update();
	}

	
};

///////////// DOM CREATION: Translation ////////////////

d3.select("#langSelectFr")
				.on('click',function() {translate('fr',node);});

d3.select("#langSelectDe")
				.on('click',function() {translate('de',node);});

let dictLabel =   [{'id':'ratT','de':'Rat','fr':'Conseil'},
					{'id':'legT','de':'Legislatur','fr':'Législature'},
					{'id':'topT','de':'Thema','fr':'Sujet'},
					{'id':'colT','de':'Farbe','fr':'Couleur'},
					{'id':'linT','de':'Mindestanzahl Zusammenarbeiten','fr':'Nombre minimum de collaborations'},
					{'id':'busT','de':'Art des Vorstosses','fr':"Type d'intervention"},
					{'id':'cooT','de':'Zusammenarbeit','fr':'Coopération'},
					{'id':'datQT','de':'Datenquelle','fr':'Source de données'},
					{'id':'datAT','de':'Datenaufbereitung','fr':'Préparation des données'},
					{'id':'vizExplT','de':'Erklärungen zur Visualisierung','fr':'Explications sur la visualisation'},
					{'id':'storyT','de':'Interpretation zur Visualisierung','fr':'Interprétation pour la visualisation'},
				 ]

var currentLang;
// Set Starting Language depending on browser
var userLang = navigator.language || navigator.userLanguage;
if (userLang.includes('fr')) {
	currentLang='fr';
} else {
	currentLang='de';
};

function translate(lang,nodes) {
	dictContent.forEach(function(d) {d3.select('#'+d.id).html(d[lang])})
	dictHeadings.forEach(function(d) {d3.select('#'+d.id).html(d[lang])});
	dictLabel.forEach(function(d) {d3.select('#'+d.id).text(d[lang])});
	vorTypes.forEach(function(d) {
		if (d.de==='Fragestunde. Frage' && lang==='de') {
			d3.select('#'+d.id+'T').html('<a href='+vorBaseLink[lang]+d['link'][lang]+' target="_blank" rel="noopener noreferrer">Fragestunde Frage</a>');
			// d3.select('#'+d.id+'T2').text('Fragestunde Frage');
		} else {
			d3.select('#'+d.id+'T').html('<a href='+vorBaseLink[lang]+d['link'][lang]+' target="_blank" rel="noopener noreferrer">'+d[lang]+'</a>');
			// d3.select('#'+d.id+'T2').text(d[lang]);
		};
	});
	exint.forEach(function(d) {d3.select('#'+d.id+'T').text(d[lang])});
	ratTypes.forEach(function(d) {d3.select('#ratSel'+d.id).text(d[lang]);
								   d3.select('#storyLabel'+d.id).text(d[lang]);});
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

	/// Story Parties
	// Add story expand
	d3.select("#storyExp").on("click", d => $("#panelStory").collapse('show'));
	// Add story buttons here so they work when using translate
	d3.select("#storyNat0").on("click", d => storyFilter(leg=50,rat=1,linkStrength=20));
	d3.select("#storyNat1").on("click", d => storyFilter(leg=50,rat=1,linkStrength=20));
	d3.select("#storyNat2").on("click", d => storyFilter(leg=50,rat=1,linkStrength=60,subj='Alle Themen',color='Partei',typeFilter='All',intern=true,extern=false));
	d3.select("#storyNat3").on("click", d => storyFilter(leg=50,rat=1,linkStrength=40,subj='Alle Themen',color='Partei',typeFilter='All',intern=false,extern=true));
	d3.select("#storyNat4").on("click", d => storyFilter(leg=50,rat=1,linkStrength=5,subj='Medien und Kommunikation',color='Partei',typeFilter='All'));
	d3.select("#storyNat5").on("click", d => storyFilter(leg=50,rat=1,linkStrength=5,subj='Migration',color='Partei',typeFilter='All'));
	d3.select("#storyNat6").on("click", d => storyFilter(leg=50,rat=1,linkStrength=10,subj='Wirtschaft',color='Partei',typeFilter='All'));
	d3.select("#storyNat7").on("click", d => storyFilter(leg=50,rat=1,linkStrength=5,subj='Soziale Fragen',color='Partei',typeFilter='All'));
	d3.select("#storyNat8").on("click", d => storyFilter(leg=48,rat=1,linkStrength=10,subj='Landwirtschaft',color='Partei',typeFilter='All'));
	d3.select("#storyNat9").on("click", d => storyFilter(leg=50,rat=1,linkStrength=10,subj='Landwirtschaft',color='Partei',typeFilter='All'));
	d3.select("#storyNat10").on("click", d => storyFilter(leg=50,rat=1,linkStrength=10,subj='Umwelt',color='Partei',typeFilter='All'));
	d3.select("#storyNat11").on("click", d => storyFilter(leg=48,rat=1,linkStrength=10,subj='Umwelt',color='Partei',typeFilter='All'));
	d3.select("#storyNat12").on("click", d => storyFilter(leg=50,rat=1,linkStrength=60,subj='Alle Themen',color='Partei',typeFilter='Gesetze'));
	d3.select("#storyNat13").on("click", d => storyFilter(leg=50,rat=1,linkStrength=60,subj='Alle Themen',color='Partei',typeFilter='Anfragen'));
	d3.select("#storyNat14").on("click", d => storyFilter(leg=50,rat=1,linkStrength=60,subj='Alle Themen',color='Geschlecht',typeFilter='All'));
	d3.select("#storyNat15").on("click", d => storyFilter(leg=50,rat=1,linkStrength=30,subj='Alle Themen',color='Partei',typeFilter='All',intern=false,extern=true));

	d3.select("#storySta0").on("click", d => storyFilter(leg=50,rat=2,linkStrength=20,subj='Alle Themen',color='Partei',typeFilter='All'));
	d3.select("#storySta1").on("click", d => storyFilter(leg=48,rat=2,linkStrength=20,subj='Alle Themen',color='Geschlecht',typeFilter='All'));
	d3.select("#storySta2").on("click", d => storyFilter(leg=50,rat=2,linkStrength=20,subj='Alle Themen',color='Geschlecht',typeFilter='All'));
	d3.select("#storySta3").on("click", d => storyFilter(leg=51,rat=2,linkStrength=20,subj='Alle Themen',color='Geschlecht',typeFilter='All'));
	d3.select("#storySta4").on("click", d => storyFilter(leg=50,rat=2,linkStrength=20,subj='Alle Themen',color='Partei',typeFilter='All',intern=false,extern=true));
	d3.select("#storySta5").on("click", d => storyFilter(leg=50,rat=2,linkStrength=20,subj='Alle Themen',color='Partei',typeFilter='All'));
	d3.select("#storySta6").on("click", d => storyFilter(leg=50,rat=2,linkStrength=20,subj='Alle Themen',color='Partei',typeFilter='All'));
};

///////////// DOM CREATION: RAT SELECT ////////////////
var selectRat;
let ratTypes = [{'id':'Nat','de':'Nationalrat','fr':'Conseil national','value':1},
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
				.data(ratTypes)
				.enter()
				.append("option")
				.attr("id",function(d) {return 'ratSel'+d.id})
				.attr("value",function(d) {return d.value});

selectRat = 1
d3.select('#ratSelNat').property('selected',true);
///////////// DOM CREATION: COLOR DIM SELECT ////////////////

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

let vorBaseLink = {de:"https://www.parlament.ch/de/%C3%BCber-das-parlament/parlamentsportraet/\
beratungsgegenstaende-und-parlamentarische-verfahren/\
parlamentarische-initiativen-standesinitiativen-vorstoesse/",
				   fr:"https://www.parlament.ch/fr/%C3%BCber-das-parlament/portrait-du-parlement/\
objets-soumis-deliberation-et-procedure-parlementaire/\
initiative-parlementaires-initiatives-deposees-par-des-cantons-et-interventions/"}

let vorTypes = [{id:"filtParlIni",de:"Parlamentarische Initiative", fr:'Intervention parlementaire',
				 link:{de:"parlamentarische-initiative",fr:"initiative-parlementaire"}},
				 {id:"filtMotion",de:"Motion", fr:'Motion',
				 link:{de:"motion",fr:"motion"}},				 
				 {id:"filtPostulat",de:"Postulat", fr:'Postulat',
				 link:{de:"postulat",fr:"postulat"}},
				 {id:"filtInterp",de:"Interpellation", fr:'Interpellation',
				 link:{de:"interpellation",fr:"interpellation"}},
				 {id:"filtAnfr",de:"Anfrage", fr:"Question",
				 link:{de:"anfrage",fr:"question"}},
				 {id:"filtFragsFrage",de:"Fragestunde. Frage", fr:"Question de l'heure des questions",
				 link:{de:"fragestunde",fr:"heure-des-questions"}}];

var typeWrapper = d3.select("#typeCheckbox");

var typeButton = typeWrapper
        .selectAll(".form-check")
        .data(vorTypes)
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
	.attr("id", function(d) { return d.id; })
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
var typeFilterList = vorTypes.map(a => a.de);
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
d3.json("Data/legislatures.json").then(function(l) {
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
	selectLeg = '51'
	d3.select('#legSel'+selectLeg).property('selected',true);
	d3.selectAll(".loader").style("visibility","visible");
	d3.selectAll(".overlay").style("visibility","visible");
	loadFiles();
});


////////// FUNCTION DEFINITIONS ////////////

function loadFiles() {
	d3.json("Data/topics.json").then(function(s) {
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
		translate(currentLang); // translate after all doms have been created
		
		//	data read and store
		d3.json("Data/netzwerk_"+selectLeg+"_"+selectRat+".json").then(function(g) {
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
			//	colors for parties are picked to resemble oficcialy reported colors:
			// https://www.bfs.admin.ch/bfs/de/home/statistiken/politik/wahlen/nationalratswahlen/mandatsverteilung.html
			// https://statistik.tg.ch/themen-und-daten/staat-und-politik/wahlen-und-abstimmungen/grossratswahlen-2020-hauptseite.html/10545
			// colors for service years were picked from a seaborn color palette (Purples_d)
			// colors={
			// Colors from Thurgau
			// 	'Partei':{'SP':'#cd3700','GRÜNE':'#a2c510','glp':'#b3ee3a','CVP':'#e39e00','M-E':'#e39e00',
			// 	'EVP':'#00b4e8','FDP':'#0064e6','FDP-Liberale':'#0064e6','SVP':'#3ca433','BDP':'#ffed00','Kleinparteien':'#a5b7d4'},
			// 	'Geschlecht':{'weiblich':d3.schemeTableau10[0],'männlich':d3.schemeTableau10[1]}
			// 	};
			// Colors from bfs
			// colors={
			// 	'Partei':{'SP':'#EA546F','GRÜNE':'#26B300','glp':'#CBD401','CVP':'#F39F5E','M-E':'#F39F5E',
			// 	'EVP':'#87BFDC','FDP':'#6268AF','FDP-Liberale':'#6268AF','SVP':'#547D34','BDP':'#FFFF00','Kleinparteien':'#a5b7d4'},
			// 	'Geschlecht':{'weiblich':d3.schemeTableau10[0],'männlich':d3.schemeTableau10[1]}
			// 	};
			// Mixed Colors
			colors={
				'Partei':{'SP':'#EA546F','GRÜNE':'#26B300','glp':'#CBD401','CVP':'#F39F5E','M-E':'#F39F5E',
				'EVP':'#00b4e8','FDP':'#0064e6','FDP-Liberale':'#0064e6','SVP':'#547D34','BDP':'#FFFF00','Kleinparteien':'#a5b7d4'},
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
	let zoom
	if (selectRat.toString()==="2") {zoom=3
	} else { zoom=1 };
	if (d.Collab.length===0) {
		return Math.min(-1 * radius(d)**1.8,-40)*1.6*zoom;
	} else {
		return Math.max(Math.min(-1 * radius(d)**1.8,-40),-250)*zoom;
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

  let dictContent = [
	{'id':'textIntro',
		'de':'<p class="pMarg" style="text-align: justify">Die <b>Visualisierung</b> auf dieser Seite zeigt die <b>Aktivitäten und Zusammenarbeit</b> von Mitgliedern des Nationalrats und des Ständerats im Rahmen von parlamentarischen <b>Vorstössen</b>. \
		Diese werden als <b>Netzwerkansicht</b> dargestellt, mit den Ratsmitgliedern als Knoten und den gemeinsam eingereichten Vorstössen als Verbindungen. \
		Die verfügbaren Daten decken den Zeitraum ab der <b>47. Legislaturperiode (Wintersession 2003)</b> ab.</p> \
		\
		<p class="pMarg" style="text-align: justify">Die für die Visualisierung <b>berücksichtigten Vorstösse</b> können nach <b>Art und Thema gefiltert</b> werden. \
		Um einen <b>Einstieg in die Mehrdimensionalität</b> der dargestellten Informationen zu ermöglichen, \
		sind weiter unten einige <a href="#stories" id="storyExp">Beobachtungen</a> beschrieben, die durch Links auf der Visualisierung sichtbar gemacht werden können. </p> \
		\
		<p class="pMarg" style="text-align: justify">Die zugrundeliegenden <a href="#data">Daten</a> \
		sowie der <a href="#code">Code</a> werden unten im Detail erläutert.</p> \
		\
		<p class="pMarg text-center h5 mt-3"> \
		  <b>Diese Visualisierung ist interaktiv: Ziehen Sie die Knoten, lesen Sie die Tooltips und filtern Sie nach Belieben. <br> \
		  Viel Spass beim Spielen und Entdecken!</b> \
		</p>',
		'fr':'<p class="pMarg" style="text-align: justifier">La <b>visualisation</b> sur cette page montre les <b>activités et la collaboration</b> des membres du Conseil national et du Conseil des États dans le cadre des <b>interventions</b> parlementaires. \
		Celles-ci sont représentées sous forme de <b>visualisation en réseau</b>, où les membres du conseil comme nœuds et les interventions déposées conjointement comme liens. \
		Les données disponibles couvrent la période à partir de la <b>47e législature (session d\'hiver 2003)</b>.</p> \
		\
		<p class="pMarg" style="text-align: justifier">Les interventions <b>considérées</b> pour la visualisation peuvent être filtrées par <b>type et sujet</b>. \
		Afin de permettre une entrée dans la multidimensionnalité</b> des informations représentées, \
		certaines <a href="#stories">observations</a> sont décrites ci-dessous, qui peuvent être rendues visibles par des liens sur la visualisation. </p>\
		\
		<p class="pMarg" style="text-align: justifier">Les <a href="#data">données</a> \
		et le <a href="#code">code</a> sous-jacent sont détaillés ci-dessous.</p> \
		\
		<p class="pMarg text-center h5 mt-3"> \
		<b>Cette visualisation est interactive : faites glisser les nœuds, lisez les info-bulles et filtrez à votre guise. <br> \
		Amusez-vous à jouer et à découvrir !</b> \
		</p>'
	},
		{
		'id':'textVizExpl',
		'de':'<p class="pMarg" style="text-align: justify">Die <b>Grösse der Knoten</b> entspricht der Anzahl der beteiligten Vorstösse. \
		<b>Achtung: Eine Beteiligung an einem Vorstoss gibt keine Information über die Art und das Ausmass der Beteiligung (ob Initiierung, Ausarbeitung oder lediglich Mitunterschrift).</b></p> \
		\
		<p class="pMarg" style="text-align: justify">Die <b>Farbe</b> der Knoten signalisiert eine von vier wählbaren persönlichen Eigenschaften (Partei, Geschlecht, Dienstjahre insgesamt und Dienstjahre in der ausgewählten Legislaturperiode). \
		Ratsmitglieder ohne eingereichten Vorstoss werden im äussersten Ring dargestellt.</p> \
		\
		<p class="pMarg" style="text-align: justify">Die <b>Breite der Verbindung</b> zwischen zwei Ratsmitgliedern zeigt an, wie viele Vorstösse gemeinsam eingereicht wurden. \
		Um eine bessere Übersicht zu gewährleisten, kann frei gewählt werden, ab wie vielen gemeinsamen Vorstössen eine Verbindung angezeigt werden soll (standardmässig ab 10). \
		Aus Gründen der Performance wird die <b>Mindestanzahl der Kooperationen</b> automatisch erhöht, falls die Zahl der Verbindungen zu gross wird</p>',
		'fr':'<p class="pMarg" style="text-align: justifier">La <b>taille des nœuds</b> correspond au nombre d\'interventions parlementaires impliquées. \
		<b>Attention : La participation à une initiative ne fournit aucune information sur le type et le niveau de participation (initiation, élaboration ou simple co-signature).</b></p> \
		\
		<p class="pMarg" style="text-align: justify">La <b>couleur</b> des nœuds signale l\'une des quatre caractéristiques personnelles sélectionnables (parti, sexe, nombre total d\'années de service et années de service au cours de la législature sélectionnée). \
		Les membres du conseil qui n\'ont pas soumis d\'intervention sont représentés dans l\'anneau le plus à l\'extérieur.</p> \
		\
		<p class="pMarg" style="text-align: justify">La <b>largeur du lien</b> entre deux membres du conseil indique combien d\'interventions ont été déposées ensemble. \
		Afin de permettre une meilleure vue d\'ensemble, vous pouvez choisir librement à partir de combien d\'interventions communes une liaison doit être affichée (par défaut à partir de 10). \
		Pour des raisons de performance, le <b>nombre minimum de collaborations</b> est automatiquement augmenté si le nombre de connexions devient trop important</p>'
	},
	{
		'id':'textStoryNat',
		'de':'<p style="text-align:center"><i>Die folgende Analyse bezieht sich hauptsächlich auf die <a href="javascript:void(0)" id="storyNat0">50. Legislaturperiode</a></i></p> \
		<p style="text-align: justify">\
		  Die <a href="javascript:void(0)" id="storyNat1">Zusammenarbeit im Nationalrat</a> findet zu einem grossen Teil innerhalb der Parteien statt.\
		  Die überparteiliche Verknüpfung der parteiinternen Netzwerke zeigt eine klare Aufteilung entlang der politischen links-rechts Achse. \
		  Auf der politischen Linken bilden die Grünen und die SP einen gemeinsamen Cluster und auf der politisch rechten Seite die SVP.\
		  Die Brücke zwischen beiden Clustern wird von den Mitte-Parteien (CVP, FDP, glp, EVP und BDP) gebildet, \
		  wobei sich die EVP und glp eher in der Nähe des Grüne/SP Clusters und die FDP eher in der Nähe des SVP Clusters gruppieren. <br>\
		  Die Partei mit der grössten <a href="javascript:void(0)" id="storyNat2">parteiinternen Zusammenarbeit</a> ist die SP \
			und die stärkste <a href="javascript:void(0)" id="storyNat3">überparteiliche Vernetzung</a> existiert zwischen SP und den Grünen.\
		</p>\
		<p style="text-align: justify">\
		  Die Zusammenarbeit über Parteigrenzen hinweg ist auch Themenabhängig. Ein Thema mit relativ viel lagerübergreifende Zusammenarbeit ist \
		  <a href="javascript:void(0)" id="storyNat4">Medien und Kommunikation</a>\
		  (siehe z.B. Balthasar Glättli (Grüne) und Franz Grüter (SVP)). Ein Thema wo es dagegen kaum lagerübergreifende Zusammenarbeit gibt ist \
		  <a href="javascript:void(0)" id="storyNat5">Migration</a>.\
		  Auch die politische Nähe der Mitte-Parteien zum linken oder rechten Lager kann sich je nach Thema unterscheiden. \
		  Im Thema <a href="javascript:void(0)" id="storyNat6">Wirtschaft</a> beispielsweise arbeiten die Mitte-Parteien BDP und CVP enger mit der SVP zusammen \
		  und im Thema <a href="javascript:void(0)" id="storyNat7">Soziale Fragen</a> enger mit den Linksparteien.\
		</p>\
		<p style="text-align: justify">\
		  Das politische Interesse an bestimmten Themen kann sich auch mit der Zeit wandeln. \
		  War <a href="javascript:void(0)" id="storyNat8">Landwirtschaft in der 48. Legislatur</a> noch ein von vor allem der SVP und nur teilweise den Grünen bearbeitetes Thema, \
		  formiert sich spätestens ab der <a href="javascript:void(0)" id="storyNat9">50. Legislatur</a> ein linkes Netzwerk aus den Grünen, SP und glp. <br>\
		  Das Thema <a href="javascript:void(0)" id="storyNat10">Umwelt hat in der 50. Legislatur</a> im Vergleich \
		  zu den <a href="javascript:void(0)" id="storyNat11">Legislaturen davor</a> stark an Bedeutung gewonnen.\
		  Ein Grund dafür könnte die Klimabewegung sein die seit 2018 stark an Momentum gewonnen hat.\
		  Wurde jedoch das Thema in den Legislaturen davor noch von allen politischen Lagern bearbeitet, \
		  so ist es in der 50. Legislatur vor allem ein Thema von SP, Grünen und glp geworden.\
		</p>\
		<p style="text-align: justify">\
		  Die Ratsmitglieder der SP sind an den meisten Vorstössen beteiligt, sowohl bezüglich Vorstössen die die \
		  <a href="javascript:void(0)" id="storyNat12">Gesetzgebung</a> betreffen, als auch bei <a href="javascript:void(0)" id="storyNat13">Anfragen</a>.\
		  Ein Teilgrund dafür ist auch die starke parteiinterne Zusammenarbeit und die enge Zusammenarbeit mit den Grünen. <br>\
		  Die Nationalrätin Martina Munz (SP) war dabei das aktivste Ratsmitglied des Nationalrats in der 50. Legislaturperiode und an insgesamt 1003 Vorstössen beteiligt \
		  (524 Vorstösse betreffend der Gesetzgebung und 479 Anfragen). Die Zweit- und Drittplazierten sind ebenfalls <a href="javascript:void(0)" id="storyNat14">Frauen aus der SP</a>: \
		  Claudia Friedl mit 936 Vorstössen und Bea Heim mit 840 Vorstössen.<br>\
		  Die grössten <a href="javascript:void(0)" id="storyNat15">Brückenbauer</a> zwischen dem linken und dem rechten Lager waren Karl Vogler von der csp-ow und Thomas Weibel von der glp.\
		</p>',
		'fr':'<p style="text-align:center"><i>L\'analyse suivante concerne principalement le <a href="javascript:void(0)" id="storyNat0">50. Période législative</a></i></p> \
		<p style="text-align : justifier">\
		La <a href="javascript:void(0)" id="storyNat1">coopération au sein du Conseil national</a> se fait en grande partie au sein des partis.\
		L\'articulation interpartisale des réseaux internes du parti montre une nette division le long de l\'axe politique gauche-droite. \
		À gauche politique, les Verts et le PS forment un groupe commun et à droite politique, l\'UDC.\
		Le pont entre les deux clusters est formé par les partis du centre (PDC, PRD, pvl, PEV et PBD),\
		le PEV et le pvl se regroupant plutôt à proximité du cluster Verts/PS et le PRD plutôt à proximité du cluster UDC. <br>\
		La partie avec la plus grande <a href="javascript:void(0)" id="storyNat2">coopération interne</a> est le PS \
		et le <a href="javascript:void(0)" id="storyNat3">réseau interpartis</a> le plus fort existe entre le PS et les Verts.\
		</p>\
		<p style="text-align : justifier">\
		La coopération entre les partis dépend également du sujet. Un sujet avec une quantité relativement importante de collaboration entre les camps est \
		<a href="javascript:void(0)" id="storyNat4">médias et communication</a>\
		(voir par exemple Balthasar Glättli (Parti Vert) et Franz Grüter (UDC)). Par contre\
		la <a href="javascript:void(0)" id="storyNat5">politique migratoire</a> est un sujet où la collaboration entre les différents partis est quasi inexistante.\
		La proximité politique des partis du centre avec le camp de gauche ou de droite peut également varier selon les sujets. \
		Dans le sujet <a href="javascript:void(0)" id="storyNat6">économie</a>, par exemple, les partis du centre PBD et PDC travaillent plus étroitement avec l\'UDC \
		et dans le sujet <a href="javascript:void(0)" id="storyNat7">questions sociales</a> plus étroitement avec les partis de gauche.\
		</p>\
		<p style="text-align : justifier">\
		L\'intérêt politique pour certaines questions peut également évoluer avec le temps. \
		Lors de la <a href="javascript:void(0)" id="storyNat8">48e législature, l\'agriculture</a> était encore un sujet traité principalement par l\'UDC et seulement partiellement par les Verts.\
		Mais à partir de la <a href="javascript:void(0)" id="storyNat9">50. Législature</a> au plus tard, un réseau de gauche composé des Verts, du PS et du PVL se forme. <br>\
		Le sujet <a href="javascript:void(0)" id="storyNat10">environnement a dans la 50e législature</a> en comparaison \
		aux <a href="javascript:void(0)" id="storyNat11">législatures avant cela</a> ont gagné en importance.\
		Une des raisons à cela pourrait être le mouvement climatique, qui a pris de l\'ampleur depuis 2018.\
		Alors que ce sujet était encore traité par tous les camps politiques au cours des législatures précédentes,\
		il est devenu un sujet principalement traité par le PS, les Verts et le pvl au cours de la 50e législature.\
		</p>\
		<p style="text-align : justifier">\
		Les députés du PS sont impliqués dans la plupart des intervention, tant en ce qui concerne les intervention que le \
		<a href="javascript:void(0)" id="storyNat12">législation</a>, ainsi que <a href="javascript:void(0)" id="storyNat13">enquêtes</a> >.\
		Cela s\'explique en partie par la forte coopération au sein du parti et l\'étroite collaboration avec les Verts. <br>\
		La députée Martina Munz (PS) a été la membre la plus active du Conseil national au cours de la 50e législature et a participé à un total de 1003 intervention \
		(524 demandes de législation et 479 enquêtes). Les deuxième et troisième places sont également des <a href="javascript:void(0)" id="storyNat14">femmes de PS</a> : \
		Claudia Friedl avec 936 avances et Bea Heim avec 840 avances.<br>\
		Les plus grands <a href="javascript:void(0)" id="storyNat15">bâtisseurs de ponts</a> entre les camps de gauche et de droite étaient Karl Vogler de csp-ow et Thomas Weibel de PVL.\
		</p>'
	},
	{
		'id':'textStorySta',
		'de':'<p style="text-align:center"><i>Die folgende Analyse bezieht sich hauptsächlich auf die <a href="javascript:void(0)" id="storySta0">50. Legislaturperiode</a></i></p>\
		<p style="text-align: justify">\
		  Die Meisten Trends aus dem Nationalrat, lassen sich in auch so ähnlich im Ständerat beobachten.\
		</p>\
		<p>\
		  Ein Unterschied zwischen National- und Ständerat ist der Frauenanteil. Im Ständerat ist dieser traditionell deutlich kleiner. \
		  Von der <a href="javascript:void(0)" id="storySta1">48.</a> bis zur <a href="javascript:void(0)" id="storySta2">50. Legislaturperiode</a> \
		  ist er stetig bis auf einen Wert von 15 % gesunken und erst zur <a href="javascript:void(0)" id="storySta3">51. Legislatur</a> wieder angestiegen.\
		</p>\
		<p style="text-align: justify">\
		  Ein weiterer Unterschied zwischen National- und Ständerat ist, die <a href="javascript:void(0)" id="storySta4">parteiübergreifende Zusammenarbeit</a> \
		  die im Ständerat tendenziell grösser ist als im Nationalrat. \
		  Dennoch gibt es eine sichtbare <a href="javascript:void(0)" id="storySta5">Aufteilung der Netzwerke</a> nach politischen Lagern. \
		  Im Gegensatz zum Nationalrat dominieren allerdings Hier die Mitte-Parteien, sowohl im Hinblick auf Anzahl der Ratsmitglieder, als auch Zusammenarbeit.\
		  Im Ständerat stellen die CVP und die FDP die Ratsmitglieder die in der 50. Legislaturperiode and den meissten Vorstössen beteiligt waren.\
		</p>\
		<p style="text-align: justify">\
		  Der in der <a href="javascript:void(0)" id="storySta6">50. Legislaturperiode</a> an den meisten Vorstössen beteiligte Ständerat war Damian Müller (FDP, Luzern) mit 152 Vorstössen. \
		  Die meisten Vorstösse bezüglich Gesetzgebung hatte Erich Ettlin (CVP, Obwalden, 115 Vorstösse) und bezüglich Anfragen Anne Seydoux-Christe (CVP, Jura, 61 Vorstösse) zu verzeichnen.\
		  Anne Seydoux-Christe war auch die grösste Brückenbauerin zwischen den politischen Lagern.\
		</p>',
		'fr':'<p style="text-align:center"><i>L\'analyse suivante concerne principalement le <a href="javascript:void(0)" id="storySta0">50. Période législative</a></i></p>\
		<p style="text-align : justifier">\
		La plupart des tendances issues du Conseil national s\'observent également de manière similaire au Conseil des États.\
		</p>\
		<p>\
		Une différence entre le Conseil national et le Conseil des États est la proportion de femmes. Au Conseil des Etats, elle est traditionnellement nettement plus faible. \
		Du <a href="javascript:void(0)" id="storySta1">48.</a> au <a href="javascript:void(0)" id="storySta2">50. législature</a> \
		il a régulièrement chuté à une valeur de 15 % et seulement à <a href="javascript:void(0)" id="storySta3">51. La législature</a> a de nouveau augmenté.\
		</p>\
		<p style="text-align : justifier">\
		Une autre différence entre le Conseil national et le Conseil des États est la <a href="javascript:void(0)" id="storySta4">coopération entre les partis</a> \
		qui tend à être plus importante au Conseil des États qu\'au Conseil national. \
		Cependant, il existe une <a href="javascript:void(0)" id="storySta5">division des réseaux</a> visible selon les camps politiques. \
		Contrairement au Conseil national, cependant, les partis du centre dominent ici, tant en termes de nombre de députés que de coopération.\
		Au Conseil des États, le CVP et le FDP sont les députés qui ont été impliqués dans la plupart des intervention de la 50e législature.\
		</p>\
		<p style="text-align : justifier">\
		Celui du <a href="javascript:void(0)" id="storySta6">50. Législature</a> Le député concerné par la plupart des intervention était Damian Müller (FDP, Lucerne) avec 152 intervention. \
		Erich Ettlin (CVP, Obwald, 115 interventions) et Anne Seydoux-Christe (CVP, Jura, 61 interventions) ont fait le plus de questions de législation.\
		Anne Seydoux-Christe a également été la plus grande bâtisseuse de ponts entre les camps politiques.\
		</p>'
	},
	// {
	// 	'id':'textVorInit',
	// 	'de':'Mit einer <b>Parlamentarische Initiative</b> kann ein Ratsmitglied, \
	// 	den Entwurf zu einem Erlass oder die Grundzüge eines solchen Erlasses vorschlagen. \
	// 	Die Leitung der Gesetzgebungsarbeiten erfolgt durch eine Kommission des National- oder Ständerates.',
	// 	'fr':'Par la voie de <b>l\'initiative parlementaire</b>, un député peut déposer un projet d\'acte ou les grandes lignes d\'un tel acte. \
	// 	Les travaux législatifs sont menés par une commission du Conseil national ou du Conseil des Etats.'
	// },
	// {
	// 	'id':'textVorMot',
	// 	'de':'Mit einer <b>Motion</b> wird der Bundesrat beauftragt, einen Entwurf zu einem Erlass der Bundesversammlung vorzulegen oder eine Massnahme zu treffen.',
	// 	'fr':'La <b>motion</b> est une intervention qui charge le Conseil fédéral de déposer un projet d\'acte de l\'Assemblée fédérale ou de prendre une mesure.'
	// },
	// {
	// 	'id':'textVorPost',
	// 	'de':'Ein <b>Postulat</b> beauftragt den Bundesrat zu prüfen und zu berichten, ob ein Entwurf zu einem Erlass der Bundesversammlung vorgelegt oder eine Massnahme getroffen werden muss.',
	// 	'fr':'Le <b>postulat</b> charge le Conseil fédéral d\'examiner l\'opportunité, soit de déposer un projet d\'acte de l\'Assemblée fédérale, soit de prendre une mesure et de présenter un rapport à ce sujet.'
	// },
	// {
	// 	'id':'textVorInter',
	// 	'de':'Mit einer <b>Interpellation</b> verlangt ein Ratsmitglied vom Bundesrat Auskunft über wichtige innen- und aussenpolitische Ereignisse und Angelegenheiten des Bundes. \
	// 	Die Urheber:innen können beim Einreichen der Interpellation beantragen, dass diese dringlich erklärt wird. Nach Beantwortung durch den Bundesrat können die Urheber:innen eine Diskussion darüber verlangen.',
	// 	'fr':'En déposant une <b>interpellation</b>, un député demande au Conseil fédéral de leur fournir des informations sur des événements ou des problèmes concernant soit la politique intérieure ou extérieure, soit l\'administration. \
	// 	Lors du dépôt de l\'interpellation, les auteurs peuvent demander qu\'elle soit déclarée urgente. Après réponse du Conseil fédéral, les auteurs peuvent demander une discussion à ce sujet.'
	// },
	// {
	// 	'id':'textVorQuest',
	// 	'de':'Eine <b>Anfrage</b> verlangt ein Ratsmitglied vom Bundesrat Auskunft über wichtige innen- und aussenpolitische Ereignisse und Angelegenheiten des Bundes. \
	// 	Die Urheber:innen können beim Einreichen der Interpellation beantragen, dass diese dringlich erklärt wird. \
	// 	Anders als bei der Interpellation gibt es nach Beantwortung durch den Bundesrat keine Möglichkeit zur Diskussion.',
	// 	'fr':'La <b>question</b> permet à un ou une parlementaire d\'exiger du Conseil fédéral qu\'il fournisse des renseignements sur une affaire de politique intérieure ou extérieure importante.. \
	// 	Lors du dépôt de l\'interpellation, les auteurs peuvent demander qu\'elle soit déclarée urgente. \
	// 	Contrairement à l\'interpellation, il n\'y a pas de possibilité de discussion une fois que le Bundesrat a répondu.'
	// },
	// {
	// 	'id':'textVorQuestQuest',
	// 	'de':'Die Montagssitzungen des Nationalrates der zweiten und dritten Sessionswoche beginnen mit der <b>Fragestunde</b>. \
	// 	Dabei behandelt der Rat aktuelle Fragen, die Ratsmitglieder bis Mittwochmittag der Vorwoche eingereicht haben.',
	// 	'fr':'Au Conseil national, les deuxième et troisième semaines de session débutent par une <b>heure des questions</b>, \
	// 	consacrée aux problèmes d\'actualité. Les questions doivent impérativement avoir été déposées le mercredi précédant l\'heure des questions.'
	// },
	{
		'id':'textDataSource',
		'de':'Die <b>Daten</b> zu den Ratsmitgliedern\
		und den Vorstössen wurden von der <b>API der Parlamentsdienste</b> bezogen: <a href="https://ws.parlament.ch/odata.svc" target="_blank" rel="noopener noreferrer">ws.parlament.ch/odata.svc</a>. <br>\
		Die dort verfügbaren Daten können in für Menschen lesbarer Form gesichtet und abgefragt werden in dem z.B. die Metadaten-URL \
		(<a href="https://ws.parlament.ch/odata.svc" target="_blank" rel="noopener noreferrer">https://ws.parlament.ch/odata.svc/$metadata</a>) \
		im <a href="https://pragmatiqa.com/xodata/#" target="_blank" rel="noopener noreferrer">Onlinetool von PragmatiQa</a> eingegeben wird.',
		'fr':'Les <b>données</b> sur les députés\
		et les requêtes ont été obtenues à partir de l\'<b>API des Services parlementaires</b>: <a href="https://ws.parlament.ch/odata.svc" target="_blank" rel="noopener noreferrer" >ws.parlament.ch/odata.svc</a>. <br>\
		Les données qui y sont disponibles peuvent être visualisées et interrogées sous une forme lisible par l\'homme, par exemple en saisissant l\'URL des métadonnées \
		(<a href="https://ws.parlament.ch/odata.svc" target="_blank" rel="noopener noreferrer">https://ws.parlament.ch/odata.svc/$metadata</ a>)\
		saisies dans l\'outil en ligne <a href="https://pragmatiqa.com/xodata/#" target="_blank" rel="noopener noreferrer">PragmatiQa</a>.'
	},
	{
		'id':'textDataAnal',
		'de':'<p>\
		Die Daten wurden mithilfe eines <a href="https://github.com/JurekMueller/Vorstoesse_Bund/tree/master/python" target="_blank" rel="noopener noreferrer">Python-Skripts</a> von der API der Parlamentsdienste abgefragt und verarbeitet. \
		Kleine <b>Regionalparteien</b> wurden der bundesweiten Mutterpartei zugeordnet, wo eine solche existiert. <br>\
		Vergangene <b>Parteifusionen oder Umbenennungen</b> (z.B. CVP und BDP zu Mitte) wurden manuell für die gesamte entsprechende Legislaturperiode erfasst. <br>\
		Seltene <b>Parteiwechsel</b> innerhalb einer Legislaturperiode können zur Darstellung von inkonsistenten Parteizugehörigkeiten führen, da die Daten keine Information über das genaue Datum des Parteiwechsels beinhalten.<br>\
		Nach der Datenverarbeitung wurden die für die Netzwerkvisualisierung relevanten Daten pro Legislatur\
		in ein <a href="https://github.com/JurekMueller/Vorstoesse_Bund/tree/master/Data" target="_blank" rel="noopener noreferrer">Netzwerk JSON-Formt</a> (bestehend aus Knoten und Verbindungen) umstrukturiert. <br>\
	  	</p>',
		'fr':'<p>\
		Les données ont été extraites de l\'API à l\'aide d\'un <a href="https://github.com/JurekMueller/Vorstoesse_Bund/tree/master/python" target="_blank" rel="noopener noreferrer">script Python</a> interrogées et traitées par les services parlementaires. \
		Les petits <b>partis régionaux</b> ont été fusionnés avec le parti parent national lorsqu\'il en existe un. <br>\
		Les <b>fusions ou changements de nom de parti antérieurs</b> (par exemple, CVP et BDP en Mitte) ont été enregistrés manuellement pour toute la période législative correspondante. <br>\
		De rares <b>changements de parti</b> au cours d\'une période législative peuvent conduire à la présentation d\'affiliations partisanes incohérentes, puisque les données ne contiennent aucune information sur la date exacte du changement de parti.<br>\
		Après le traitement des données, les données pertinentes pour la visualisation du réseau ont été stockées par législature\
		dans un <a href="https://github.com/JurekMueller/Vorstoesse_Bund/tree/master/Data" target="_blank" rel="noopener noreferrer">format réseau JSON</a> (composé de nœuds et de connexions ) restructuré. <br>\
		</p>'
	},
	{
		'id':'textCode',
		'de':'Die <b>interaktive Visualisierung</b> wurde hauptsächlich mit der Javaskript Bibliothek <a href="https://d3js.org/" target="_blank" rel="noopener noreferrer">D3.js</a> gebaut.\
		Darüber hinaus wurde <a href="https://d3-legend.susielu.com/" target="_blank" rel="noopener noreferrer">D3-legend.js</a> verwendet, um die Legenden zu erstellen,\
		<a href="https://jquery.com/" target="_blank" rel="noopener noreferrer">jQuery</a> für einzelne Komfortfunktionen\
		und <a href="https://getbootstrap.com/" target="_blank" rel="noopener noreferrer">Bootstrap</a> beim Design der Webseite. <br>\
		\
		Die <span class="fw-bold">Visualisierung und die Webseite</span> sind eine Adaption einer ähnlichen Visualisierung der\
		<a href="https://zusammenarbeit-grossrat-thurgau.opendata.iwi.unibe.ch/" target="_blank" rel="noopener noreferrer">Zusammenarbeit im Grossen Rat von Thurgau</a>. <br>\
		\
		Der gesamte <span class="fw-bold">Quellcode</span> und die Daten sind auf \
		<a href="https://github.com/JurekMueller/Vorstoesse_Bund" target="_blank" rel="noopener noreferrer">Github</a> unter\
		der <a href="https://www.mozilla.org/en-US/MPL/2.0/" target="_blank" rel="noopener noreferrer">Mozilla Public License 2.0</a> veröffentlicht.',
		'fr':'La <b>visualisation interactive</b> a été principalement construite avec la bibliothèque javascript <a href="https://d3js.org/" target="_blank" rel="noopener noreferrer">D3.js</a> .\
		De plus, <a href="https://d3-legend.susielu.com/" target="_blank" rel="noopener noreferrer">D3-legend.js</a> a été utilisé pour créer les légendes, \
		<a href="https://jquery.com/" target="_blank" rel="noopener noreferrer">jQuery</a> pour les fonctions de confort individuelles\
		et <a href="https://getbootstrap.com/" target="_blank" rel="noopener noreferrer">Bootstrap</a> lors de la conception du site Web. <br>\
		\
		La <span class="fw-bold">visualisation et le site Web</span> sont une adaptation d\'une visualisation similaire de la\
		<a href="https://arbeit-grossrat-thurgau.opendata.iwi.unibe.ch/" target="_blank" rel="noopener noreferrer">Coopération au Conseil de Thurgovie</a>. <br>\
		\
		Tout le <span class="fw-bold">code source</span> et les données sont sur \
		<a href="https://github.com/JurekMueller/Vorstoesse_Bund" target="_blank" rel="noopener noreferrer">Github</a> sous\
		qui publie la <a href="https://www.mozilla.org/en-US/MPL/2.0/" target="_blank" rel="noopener noreferrer">Mozilla Public License 2.0</a>.'
	},
	{
		'id':'textImpress',
		'de':`<p class="h5">Die interaktive Visualisierung, die auf dieser Seite vorgestellt wird, ist ein Projekt des \
		<a href="https://www.bfh.ch/en/research/research-areas/public-sector-transformation/" target="_blank" rel="noopener noreferrer">Institute Public Sector Transformation</a> der Berner Fachhochschule.\
		</p>\
		<p class="h5"><b>Autor: Jurek Müller</b>\
		  <a class="ps-2 pe-1" href="https://www.linkedin.com/in/jurek-m%C3%BCller-a21424210/" target="_blank" rel="noopener noreferrer"><img src="./Images/linkedin.svg" style="width: 2%; height: auto;"></a>\
		  <a class="ps-1 pe-1" href="mailto:jurek_mueller@yahoo.de" target="_blank" rel="noopener noreferrer"><img src="./Images/envelope.svg" style="width: 2%; height: auto;"></a>\
		  <a class="ps-1" href="https://github.com/JurekMueller/" target="_blank" rel="noopener noreferrer"><img src="./Images/github.svg" style="width: 2%; height: auto;"></a>\
		</p>\
		<p class="h5"><b>Lizenz: </b><a href="https://www.mozilla.org/en-US/MPL/2.0/" target="_blank" rel="noopener noreferrer">Mozilla Public License 2.0</a></p>\
		<p class="h5">Daten zuletzt aktualisiert: ${dateData}, Webseite zuletzt aktualisiert: ${dateWeb}</p>`,
		'fr':`<p class="h5">La visualisation interactive présentée sur cette page est un projet de \
		<a href="https://www.bfh.ch/fr/recherche/domaines-de-recherche/transformation-du-secteur-public/" target="_blank" rel="noopener noreferrer">Institute Public Sector Transformation</a> de la Haute école spécialisée bernoise.\
		</p>\
		<p class="h5"><b>Auteur : Jurek Müller</b>\
		<a class="ps-2 pe-1" href="https://www.linkedin.com/in/jurek-m%C3%BCller-a21424210/" target="_blank" rel="noopener noreferrer"> <img src="./Images/linkedin.svg" style="largeur : 2 % ; hauteur : automatique ;"></a>\
		<a class="ps-1 pe-1" href="mailto:jurek_mueller@yahoo.de" target="_blank" rel="noopener noreferrer"><img src="./Images/envelope.svg" style= "largeur : 2 % ; hauteur : automatique ;"></a>\
		<a class="ps-1" href="https://github.com/JurekMueller/" target="_blank" rel="noopener noreferrer"><img src="./Images/github.svg" style= "largeur : 2 % ; hauteur : automatique ;"></a>\
		</p>\
		<p class="h5"><b>Licence : </b><a href="https://www.mozilla.org/en-US/MPL/2.0/" target="_blank" rel="noopener noreferrer">Mozilla Public License 2.0</a></p>\
		<p class="h5">Dernière mise à jour des données : ${dateData}, dernière mise à jour de la page Web : ${dateWeb}</p>`
	},
  ]

dictHeadings = [
	{'id':'headTitle','de':'Zusammenarbeit der Mitglieder <br> des National- & Ständerats',
	'fr':'Coopération entre les membres du <br> Conseil national et du Conseil des États'},
	{'id':'headIntro','de':'Einleitung','fr':'Introduction'},
	{'id':'headViz','de':'Netzwerkvisualisierung','fr':'Visualisation du réseau'},
	{'id':'headBus','de':'Erläuterung Vorstösse','fr':'Explication des interventios'},
	{'id':'headDat','de':'Erläuterung Daten','fr':'Explication des données'},
	{'id':'headCode','de':'Erläuterung Code','fr':'Explication du code'},
]
