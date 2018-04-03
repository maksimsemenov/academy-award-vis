/* global d3 */
/* global window */


var data = [];
var genres = [];

d3.csv('award_actors.csv',
	   function(d) {
		return {
			name: d.actor_name,
			gender: d.gender,
			birth: new Date(d.date_of_birth.slice(6), d.date_of_birth.slice(3,5), d.date_of_birth.slice(0,2)),
			death: d.date_of_death? new Date(d.date_of_death.slice(6), d.date_of_death.slice(3,5), d.date_of_death.slice(0,2)) : undefined,
			
			film: {
				title: d.film,
				award: d.award_type,
				boxOffice: d.boxOffice? d.boxOffice : undefined,
				budget: d.budget? d.budget : undefined,
				genre: d.genre? d.genre : undefined,
				date: new Date(d.date_of_award.slice(6), d.date_of_award.slice(3,5), d.date_of_award.slice(0,2))
				}
			};
		},
	   function(actors) {
			actors.forEach(function(a) {
				function actorByName(actor) {
					return actor.name === a.name;
				}
				//if (genres.indexOf(a.film.genre)<0) {genres.push(a.film.genre);}
				a.film.filmAge = a.film.date.getFullYear() - a.birth.getFullYear();//award age
				var act = data.filter(actorByName);
				if (act.length > 0) {
					act[0].films.push(a.film);
				} else {
					var today = new Date();
					var newActor = {
						name: a.name,
						gender: a.gender,
						birth: a.birth,
						death: a.death,
						age: a.death? a.death.getFullYear() - a.birth.getFullYear() : today.getFullYear() - a.birth.getFullYear(),
						films: [a.film]
					};
					data.push(newActor);
				}
				
	});
	
	data.sort(function(a, b) {
		return a.birth>b.birth? 1 : a.birth<b.birth? -1 : 0;
	});
	
	var actorsByGender = d3.nest()
						.key(function(d) {return d.gender;})
						.entries(data);
	
	var parent = d3.select('#chart')
	.append('svg')
	.style('width', window.innerWidth>1400? window.innerWidth : '1500px')
	.style('height', window.innerHeight>1400? window.innerHeight : '1500px');	
	
	//var createChart = function(data, parent) {
	
	var calculateEnv = function(data) {
		var env = {
			over: "ontouchstart" in window ? "touchstart" : "mouseover",
			out: "ontouchstart" in window ? "touchend" : "mouseout",
			width: Number(parent.style('width').slice(0, -2)),
			height: Number(parent.style('height').slice(0, -2)),
			
			maxLife: d3.max(data.map(function(a) {
				return a.death? a.death.getFullYear()-a.birth.getFullYear() : 0;})),
			maxFilmAge: d3.max(data.map(function(a) {
				return d3.max(a.films.map(function(f) {
					return f.date.getFullYear() - a.birth.getFullYear();}));})),
			minFilmAge: d3.min(data.map(function(a) {
				return d3.min(a.films.map(function(f) {
					return f.date.getFullYear() - a.birth.getFullYear();}));})),
			grade: [0, 0, 0, 0],
			
			gradeColor: '#f0f0f0'
		};
		env.maxRadius = d3.min([env.width, env.height])/2-150,
			
		env.radius = d3.scale.linear()
					.domain([0, env.maxFilmAge])
					.range([0, env.maxRadius]),
			
		env.angle = d3.scale.linear()
					.domain([0, data.length])
					.range([0, 2*Math.PI]),

		env.gradeScale = d3.scale.linear()
					.domain([0, env.grade.length-1])
					.range([env.minFilmAge, env.maxFilmAge]),
			
		env.fill = d3.scale.category20();
			
		
		var maxEffictive = d3.max(data.map(function(a) {
				return d3.max(a.films.map(function(f) {
						return f.boxOffice/f.budget;
				}));
		}));
		var minEffictive = d3.min(data.map(function(a) {
			return d3.min(a.films.map(function(f) {
				return f.boxOffice/f.budget;
			}));
		}));
		env.effective = d3.scale.linear()
				.domain([minEffictive, maxEffictive])
				.range([3.5, 10]);
		
		return env;		
	};
	var env = calculateEnv(data);
		//Painting code
		var g = parent.append('g')
					.attr('transform', function() {return 'translate('+env.width/2+', '+env.height/2+')';});

//Grade ---------------------------------------------------------------------------------------------
		var showRange = function(data, env) {
			
			var grades = g.selectAll('.grades')
				.data(data);
			
			grades
				.transition()
				.duration(300)
				.style('opacity', 1)
				.attr('r', function(d, i) {var r;
										   if (d!==0) {r = env.radius(d);}
										   else {r = (i===0 || i===env.grade.length-1)? env.radius(env.gradeScale(i)) : env.radius(Math.floor(env.gradeScale(i)/10)*10);}
										   console.log(d, i, r);
										   return r;});
		
			grades
				.enter()
				.append('circle')
				.attr('class', 'grades')
				.attr('r', function(d, i) {var r;
										   if (d!==0) {r = env.radius(d);}
										   else {r = (i===0 || i===env.grade.length-1)? env.radius(env.gradeScale(i)) : env.radius(Math.floor(env.gradeScale(i)/10)*10);}
										   return r;})						
				.attr('fill', 'none')
				.attr('stroke', env.gradeColor)
				.style('opacity', '0')
				.transition()
				.duration(300)
				.style('opacity', 1);

			grades
				.exit()
				.transition()
				.duration(300)
				.style('opacity', 0);

			var gradeText = g.selectAll('.gridText')
				.data(data);
			
			gradeText
				.transition()
				.duration(300)
				.style('opacity', 1)
				.text(function(d, i) {var t;
								   if (d!==0) {t = d;}
								   else {
									   if (i===0 || i===env.grade.length-1) {t = env.gradeScale(i);}
									   else {t = Math.floor(env.gradeScale(i)/10)*10;}
								   }
								   return t;})
				.attr('transform', function(d, i) {var r;
												if (d!==0) {r = env.radius(d);}
												else {
													if (i===0 || i===env.grade.length-1) {r = env.radius(env.gradeScale(i));}
													else {r = env.radius(Math.floor(env.gradeScale(i)/10)*10);}
												}
												return 'translate('+ (r+4) + ')';});

			gradeText
				.enter()
				.append('text')
				.attr('class', 'gridText')
				.attr('fill', '#bbbbbb')
				.text(function(d, i) {var t;
									  if (d!==0) {t = d;}
									  else {
										  if (i===0 || i===env.grade.length-1) {t = env.gradeScale(i);}
										  else {t = Math.floor(env.gradeScale(i)/10)*10;}
									  }
									  return t;})
				.attr('transform', function(d, i) {var r;
												   if (d!==0) {r = env.radius(d);}
												   else {
													   if (i===0 || i===env.grade.length-1) {r = env.radius(env.gradeScale(i));}
													   else {r = env.radius(Math.floor(env.gradeScale(i)/10)*10);}
												   }
												   return 'translate('+ (r+4) + ')';})
				.style('opacity', 0)
				.transition(400)
				.style('opacity', 1);

			gradeText
				.exit()
				.transition()
				.duration(300)
				.style('opacity', 0);
		};
		
		showRange(env.grade, env);
		
//Actors name ----------------------------------------------------------------------------------------
	
		var showActors = function(data, env) {
			var actors = g.selectAll('.actorName')
				.data(data, function(d) {return d.name;});
			
			actors
				.transition()
				.duration(500)
				.attr('transform', function(d, i) {
					return 'rotate(' + (env.angle(i) * 180/Math.PI-90) + ')'
							+ 'translate(' + (env.maxRadius+30) + ')'
							+ (env.angle(i) > Math.PI ? "rotate(180)" : "");})
				.style('text-anchor', function(d, i) {return env.angle(i)>Math.PI? 'end' : null;});
			
			actors
				.enter()
				.append('text')
				.attr('class', 'actorName')
				.text(function (d) {return d.name;})
				.attr('transform', function(d, i) {
				return 'rotate(' + (env.angle(i) * 180/Math.PI-90) + ')'
					+ 'translate(' + (env.maxRadius+30) + ')'
					+ (env.angle(i) > Math.PI ? "rotate(180)" : "");})
				.style('text-anchor', function(d, i) {return env.angle(i)>Math.PI? 'end' : null;})
				.attr('fill', '#000000')
				.style('dominant-baseline', 'middle')
				.style('opacity', 0)
				.transition()
				.duration(500)
				.style('opacity', function(d) {return d.death? 0.3 : 1.0;});
			
			actors
				.exit()
				.transition()
				.delay(200)
				//.style('opacity', 0)
				.remove();
			
			return actors;
		};
		var actorsNames = showActors(data, env);
		
		var showFilms = function(data, env) {
			var filmsData = [];
			data.forEach(function(a, i) {
				a.films.forEach(function(film) {
					var color = '#bbbbbb';
					if (film.award) {color = film.award === 'ba'? '#e7ba52' : '#969696';}
					else {color = env.fill(genres.indexOf(film.genre));}
					var newCircle = {date: film.date,
									 title: film.title,
									 award: film.award? film.award : undefined,
									 actorName: a.name,
									 actorIndex: i,
									 filmAge: film.date.getFullYear() - a.birth.getFullYear(),
									 yearRadius: env.radius(film.date.getFullYear() - a.birth.getFullYear()),
									 angle: env.angle(i)-Math.PI/2,
									 radius: film.budget && film.boxOffice? env.effective(film.boxOffice/film.budget) : 3.5,
									 fill: color
									};
					filmsData.push(newCircle);
				});
			});
			
			var films = g.selectAll('.film')
				.data(filmsData);
			
			films
				.style('opacity', 0)
				.attr('cx', function(d) {return d.yearRadius * Math.cos(d.angle);})
				.attr('cy', function(d) {return d.yearRadius * Math.sin(d.angle);})
				.attr('fill', function(d) {return d.fill;})
				.transition()
				.duration(500)
				.style('opacity', 1);
			
			films
				.enter()
				.append('circle')
				.attr('class', 'film')
				.style('opacity', 0)
				.attr('r', 0)
				.attr('cx', function(d) {return d.yearRadius * Math.cos(d.angle);})
				.attr('cy', function(d) {return d.yearRadius * Math.sin(d.angle);})
				.attr('fill', function(d) {return d.fill;})
				.transition()
				.duration(500)
				.style('opacity', 1)
				.attr('r', function(d) {return d.radius;});
			
			films
				.exit()
				.transition()
				.duration(500)
				.style('opacity', 0)
				.remove();
			
			return films;
		};
		var films = showFilms(data, env);
		
		var showFilmLabel = function(data) {
			
			var filmLabel = g.append('text')
				.attr('class' , 'filmLabel')
				.style('opacity', 0)
				.attr('x', data.x)
				.attr('y', data.y)
				.text(data.title)
				.transition()
				.duration(500)
				.style('opacity', 1);
			return filmLabel;
		};
		var removeFilmLabel = function() {
			d3.selectAll('.filmLabel')
				.remove();
		}
		
		actorsNames.on(env.over, function(d) {
			showRange(d.films.map(function(f) {return f.filmAge;}), env);
			actorsNames
				.transition()
				.duration(250)
				.style('opacity', function(actor) {return actor == d? '1.0' : '0.2';});
			
			films
				.transition()
				.duration(250)
				.style('opacity', function(film) {return film.actorName === d.name? '1.0' : '0.2';});
			
		});	
		actorsNames.on(env.out, function() {
			actorsNames
				.transition()
				.duration(250)
				.style('opacity', function(actor) {return actor.death? '0.3' : '1.0';});

			films
				.transition()
				.duration(250)
				.style('opacity', '1.0');
			
			showRange(env.grade, env);
		});
		films.on(env.over, function(d) {
			actorsNames
				.transition()
				.duration(400)
				.style('opacity', function(actor) {return actor.name === d.actorName? '1.0' : '0.2';});

			films
				.transition()
				.duration(400)
				.style('opacity', function(film) {return film == d? '1.0' : '0.2';})
				.attr('r', function(film) {return film == d? film.radius*1.4 : film.radius;});

			showFilmLabel({
				x: d.yearRadius * Math.cos(d.angle) + d.radius*1.4 + 5,
				y: d.yearRadius * Math.sin(d.angle) + d.radius,
				title: d.title + ' (' +d.date.getFullYear()+ ')'
			});
			showRange([d.filmAge], env);

		});		
		films.on(env.out, function() {
			actorsNames
				.transition()
				.duration(250)
				.style('opacity', function(actor) {return actor.death? '0.3' : '1.0';});

			films
				.transition()
				.duration(250)
				.style('opacity', '1.0')
				.attr('r', function(d) {return d.radius;});

			removeFilmLabel();
			showRange(env.grade, env);
		});
	}
);