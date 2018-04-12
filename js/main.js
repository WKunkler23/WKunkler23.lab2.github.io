(function(){
    //our variables that the user can choose from the dropdown
    var attrArray = ["Alcohol consumed among persons", "ranking by WHO for alcohol use", "percentage of population who said religious belief was important", "percentage Christian", "percentage Muslim", "Percentage Atheist/Agnostic"];
    
    
    var expressed = attrArray[0];
    
    //sets up the dimensions of the chart
    var chartWidth = window.innerWidth * 0.425,
            chartHeight = 473,
            leftPadding = 25,
            rightPadding = 2,
            topBottomPadding = 5,
            chartInnerWidth = chartWidth - leftPadding - rightPadding,
            chartInnerHeight = chartHeight - topBottomPadding * 2,
            translate = "translate(" + leftPadding + "," + topBottomPadding + ")";
    
    //sets up the scale for the y axis
    var yScale = d3.scaleLinear()
        .range([463,0])
        .domain([0,100]);
    
    
    //sets up the alternate scale
    var yScale2 = d3.scaleLinear()
    .range([0, 463])
    .domain([0,150]);
    
    window.onload = setMap();



function setMap(){
    
var width = window.innerWidth * 0.5,
    height = 460;
    //sets our projection centered around the countries that make up the former Soviet Union
    var projection = d3.geoAlbers()
    .center([5.45, 41.78])
    .rotate([-104.45, -23.64])
    .parallels([29.5, 88.51])
    .scale(427.27)
    .translate([width / 2, height / 2]);
    
    var path = d3.geoPath()
    .projection(projection);
    
    //defines our map
    var map = d3.select("body")
    .append("svg")
    .attr("class", "map")
    .attr("width", width)
    .attr("height", height);
    
//puts in our inputs in the queue and initiates our callback function
d3.queue()
.defer(d3.csv, "data/FormerSovietRepublics_old.csv")
.defer(d3.json, "data/Test.topojson")
.defer(d3.json, "data/soviet_republics.topojson")
.await(callback);

function callback(error, csvData, countries, soviets){
    
   //defines the background countries 
    var backgroundCountries = topojson.feature(countries, countries.objects.ne_50m_admin_0_countries);
    
    //defines the regions that were once Soviet Republics
    var SovietRepublics = topojson.feature(countries, countries.objects.ne_50m_admin_0_countries).features;
    
//joins our csv data on alcohol use and religious practice with our topojson features
SovietRegions = joinData(SovietRepublics, csvData);

//establishes our graticule
setGraticule(map, path);
    
//establishes our colorScale, enumerations, chart, and drop down menu
var colorScale = makeColorScale(csvData);
setEnumerationUnits(SovietRepublics, map, path, colorScale)
setChart(csvData, colorScale);
createDropdown(csvData);
};
    
};
    
    //our function that creates the graticule gridlines throughout the map
    function setGraticule(map, path){
        var graticule = d3.geoGraticule()
        .step([5,5]);
          
        var gratBackground = map.append("path")
        .datum(graticule.outline())
        .attr("class", "gratBackground")
        .attr("d", path);
        
        var gratLines = map.selectAll(".gratLines")
        .data(graticule.lines())
        .enter()
        .append("path")
        .attr("class", "gratLines")
        .attr("d", path);
        
        
        
        
    }
//this function loops through our features and our csvData and joins the two
    //based on a common primary key value
    function joinData(SovietRepublics, csvData){
        
    for (var i=0; i<csvData.length; i++){
        var csvRegion = csvData[i];
        var csvKey = csvRegion.ADMIN;
        for(var a=0; a< SovietRepublics.length; a++){
            var geojsonProps = SovietRepublics[a].properties;
            var geojsonKey = geojsonProps.ADMIN;
            //console.log(geojsonKey);
            if(geojsonKey == csvKey){
            
                attrArray.forEach(function(attr){
                    var val = parseFloat(csvRegion[attr]);
                    geojsonProps[attr] = val;
                });
            };
        };
    };
}
    
   
    
    //this function appends our regions, the map, path, and appropriate colorScale values
    //to our map
    function setEnumerationUnits(SovietRepublics, map, path, colorScale){
        var regions = map.selectAll(".regions")
        
        .data(SovietRepublics)
        .enter()
        .append("path")
        .attr("class", function(d){
            return "regions " + d.properties.ADMIN;
        })
        .attr("d",path)
        .style("fill", function(d){
            return choropleth(d.properties, colorScale);
        })
        .on("mouseover", function(d){
            highlight(d.properties);
        })
        .on("mouseout", function(d){
            dehighlight(d.properties);
        })
        .on("mousemove", moveLabel);
        
        
        var desc = regions.append("desc")
        .text('{"stroke": "#000", "stroke-width": "0.5px"}');
        
    };
    
//this function sets a quantile scale for viewing our color classes 
 function makeColorScale(data){
        var colorClasses = [
            "#f1948A",
            "#EC7063",
            "#E74C3C",
            "#CB4335",
            "#B03A2E"
        ];
        
        var colorScale = d3.scaleQuantile()
        .range(colorClasses);
        
        var minmax = [
            d3.min(data, function(d){return parseFloat(d[expressed]);  }),
            d3.max(data, function(d) {return parseFloat(d[expressed]);})
            
        ];
    
        colorScale.domain(minmax);
    
    return colorScale;
};
    //this function creates our alternate color scale incase we need to reverse how we scale
    function makeAlternateScale(data){
        var colorClasses = [
            "#B03A2E",
            "#CB4335",
            "#E74C3C",
            "#EC7063",
            "#f1948A"
        ];
        var colorScale = d3.scaleQuantile()
        .range(colorClasses);
        
        var minmax = [
            d3.min(data, function(d){
                return parseFloat(d[expressed]);
            }),
            d3.max(data, function(d){
                return parseFloat(d[expressed]);
            })
        ];
        
        colorScale.domain(minmax);
        
        return colorScale;
    }
    //this function assists us in coloring our regions with the appropriate color scale based
    //on the data in our csvData table. If there is no associated color with the region than,
    //return the default color
    function choropleth(props, colorScale){
        
        var val = parseFloat(props[expressed]);
        
        if( typeof val == 'number' && !isNaN(val)){
            return colorScale(val);
        } else{
            return "#CCC";
        };
    };
    
    //this function sets the default chart dimensions, and attaches
    //the first variable as our default value, gives the default title, 
    //yaxis, and calls our update chart function
    function setChart(csvData, colorScale){
        
        
        var chart = d3.select("body")
        .append("svg")
        .attr("width", chartWidth)
        .attr("height", chartHeight)
        .attr("class", "chart");
        
        
        var chartBackground = chart.append("rect")
        .attr("class", "chartBackground")
        .attr("width", chartInnerWidth)
        .attr("height", chartInnerHeight)
        .attr("transform", translate);
        
        
        var bars = chart.selectAll(".bars")
        .data(csvData)
        .enter()
        .append("rect")
        .sort(function(a, b){
            return b[expressed] - a[expressed]
        })
        .attr("class", function(d){
            return "bars " + d.ADMIN;
        })
        .attr("width", chartInnerWidth / csvData.length - 1)
        .on("mouseover", highlight)
        .on("mouseout", dehighlight)
        .on("mousemove", moveLabel);
    
        var desc = bars.append("desc")
        .text('{"stroke": "none", "stroke-width": "0px"}');
        
        
        
        
        var yAxis = d3.axisLeft()
        .scale(yScale);
        //.orient("left");
        
        var axis = chart.append("g")
        .attr("class", "axis")
        .attr("transform", translate)
        .call(yAxis);
        
        var chartFrame = chart.append("rect")
        .attr("class","chartFrame")
        .attr("width", chartInnerWidth)
        .attr("height", chartInnerHeight)
        .attr("transform", translate);
        
        
        var chartTitle = chart.append("text")
        .attr("x",120)
        .attr("y", -20)
        .attr("class", "chartTitle")
        .text(expressed);
        
        
        updateChart(bars, csvData.length, colorScale);
    };
    
    //this function dehighlights each feature that is highlighted by the user
    //based on a mouseout function
    function dehighlight(props){
        
        var selected = d3.selectAll("." + props.ADMIN)
        .style("stroke", function(){
            return getStyle(this, "stroke")
        })
        .style("stroke-width", function(){
            return getStyle(this, "stroke-width")
        });
        
        
    d3.select(".infolabel")
    .remove();
        
    function getStyle(element, styleName){
            var styleText = d3.select(element)
            .select("desc")
            .text();
            
        var styleObject = JSON.parse(styleText);
        return styleObject[styleName];
        
        d3.select(".infolabel")
        .remove();
        };
        
    };
    
        
       
    //this function creates our dropdown menu options and calls change attribute function
    //with the user input
    function createDropdown(csvData){
        
        
    var dropdown = d3.select("body")
    .append("select")
    .attr("class", "dropdown")
    .on("change", function(){
        changeAttribute(this.value, csvData)
    });
    
    var titleOption = dropdown.append("option")
    .attr("class", "titleOption")
    .attr("disabled", "true")
    .attr("Select Attribute");
        
    var attrOptions = dropdown.selectAll("attrOptions")
    .data(attrArray)
    .enter()
    .append("option")
    .attr("value", function(d){ return d})
    .text(function(d){return d});
        
    
    //updateChart(bars, csvData.length, colorScale);
        
    };

//this function takes user input into account by coloring the map and updating the color and 
//data for the bar chart. 
function changeAttribute(attribute, csvData){
        
        expressed = attribute;
        
        var colorScale = makeColorScale(csvData);
        
        var AltcolorScale = makeAlternateScale(csvData);
    
        
        
       if(attribute == "ranking by WHO for alcohol use"){
           
           var bars = d3.selectAll(".bars")
           .sort(function(a,b){
               return a[expressed] - b[expressed];
           })
           .transition()
           .duration(5000);
        
           var regions = d3.selectAll(".regions")
        .transition()
        .duration(5000)
        .style("fill", function(d){
            return choropleth(d.properties, AltcolorScale)
        });
           
           updateInverseChart(bars, csvData.length, AltcolorScale);
       }else{
        var regions = d3.selectAll(".regions")
        .transition()
        .duration(5000)
        .style("fill", function(d){
            return choropleth(d.properties, colorScale)
        });
           
        var bars = d3.selectAll(".bars")
        .sort(function(a,b){
            return (b[expressed]) - (a[expressed]);
        })
        .transition()
        .duration(5000);
           updateChart(bars, csvData.length, colorScale);
       }
        
};
        
    
    //setLabel pulls label attribute and attaches it to the body the class infolabel
    //and our labelAttribute
    function setLabel(props){
        var labelAttribute = "<h1>" + props["ADMIN"] + "</h1><b>" + props[expressed] + "</b>";
        
        
        var infolabel = d3.select("body")
        .append("div")
        .attr("class", "infolabel")
        .attr("id", props.ADMIN + "_label")
        .html(labelAttribute);
        
        var regionName = infolabel.append("div")
        .attr("class", "labelname")
        .html(props.ADMO_ADMIN);
        
        console.log(infolabel);
        
    };
    
    //this function creates the label that folows the user's mouse around screen, 
   function moveLabel(){
        
        var labelWidth = d3.select(".infolabel")
        .node()
        .getBoundingClientRect()
        .width;
        
        var x1 = d3.event.clientX + 10,
            y1 = d3.event.clientY - 75,
            x2 = d3.event.clientX - labelWidth -10,
            y2 = d3.event.clientY + 25;
        
        var x = d3.event.clientX > window.innerWidth - labelWidth - 20 ? x2: x1;
        var y = d3.event.clientY < 75 ? y2 : y1;
        
        
        d3.select(".infolabel")
        .style("left", x + "px")
        .style("top", y + "px");
    };
    
    //this function is what creates the highlighting affect when the user
    //moves the mouse over each region and calls seetLabel
    function highlight(props){
        //console.log(props.ADMIN);
        var selected = d3.selectAll("." + props.ADMIN)
        .style("stroke", "blue")
        .style("stroke-width", "2");
        
        setLabel(props);
    };
    
        //this function creates our inverseChart for the rankings by WHO for alcohol consumption
    //by using our alternate scale
        function updateInverseChart(bars, n, colorScale){
            bars.attr("x", function(d,i){
                return i * (chartInnerWidth / n) + leftPadding;
            })
            .attr("height", function(d,i){
                return 463-yScale2(parseFloat(d[expressed]));
            })
            .attr("y", function(d,i){
                return yScale2(parseFloat(d[expressed])) + topBottomPadding;
            })
            .style("fill", function(d){
                return choropleth(d, colorScale);
            });
            
            var chartTitle = d3.select(".chartTitle")
            .text(expressed);
        }
    
        //this function updates our chart based on user input and uses the normal scale value
        function updateChart(bars, n, colorScale){
            bars.attr("x", function(d, i){
                return i * (chartInnerWidth / n) + leftPadding;
            })
            .attr("height", function(d,i){
                return 463 - yScale(parseFloat(d[expressed]));
            })
            .attr("y", function(d,i){
                return yScale(parseFloat(d[expressed])) + topBottomPadding;
            })
            .style("fill", function(d){
                return choropleth(d, colorScale);
            });
            
            var chartTitle = d3.select(".chartTitle")
            .text(expressed);
            
            
            
        };
    
    
    

    

    
    
        

    
})();