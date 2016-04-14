/*jshint -W117 */
/*jshint -W083 */


define([
    'src/WorldWind',
    'src/formats/kml/KmlFile',

], function(
    WorldWind,
    KmlFile) {

    var DataCreator = function(globe) {
        WorldWind.Logger.setLoggingLevel(WorldWind.Logger.LEVEL_ERROR);
        this.wwd = new WorldWind.WorldWindow(globe);
        this.wwd.addLayer(new WorldWind.BMNGOneImageLayer());
        this.wwd.addLayer(new WorldWind.BingAerialWithLabelsLayer());


        this.compass = new WorldWind.CompassLayer();
        this.wwd.addLayer(this.compass);

        this.controls = new WorldWind.ViewControlsLayer(this.wwd);
        this.wwd.addLayer(this.controls);

        this.coordinates = new WorldWind.CoordinatesDisplayLayer(this.wwd);
        this.wwd.addLayer(this.coordinates);

        this.services = [];
        this.layers = [];
        this.types = ["GeoJson", "Kml", "GeoTiff", "Collada"];
    };



    DataCreator.prototype.defaultLayers = function(input, val) {
        switch (input) {
            case 0:
                if (val) {
                    this.compass.enabled = true;
                } else {
                    this.compass.enabled = false;
                }
                break;
            case 1:
                if (val) {
                    this.controls.enabled = true;
                } else {
                    this.controls.enabled = false;
                }
                break;
            case 2:
                if (val) {
                    this.coordinates.enabled = true;
                } else {
                    this.coordinates.enabled = false;
                }
                break;
        }


    };
    DataCreator.prototype.save = function() {
        var services = JSON.stringify(this.services);
        localStorage.services = services;

        var defaultsLayer = {};
        $('#defaultLayers input:checkbox').each(function() {
            defaultsLayer[this.value]=this.checked;
        });
        
        localStorage.defaultsLayer = JSON.stringify(defaultsLayer);


    };


    DataCreator.prototype.clean = function() {
        for (var x in this.layers) {
            this.wwd.removeLayer(this.layers[x]);
        }
        this.layers = [];
        this.services = [];
    };

    DataCreator.prototype.load = function() {
        var x;
        var services = localStorage.services;
        services = JSON.parse(services);

        for (x in services) {
            this.addService(services[x]);
        }
        var defaults = JSON.parse(localStorage.defaultsLayer);
        for (x in defaults) {
            this.defaultLayers(Number(x), defaults[x]);
              $('#defaultLayers input:checkbox')[x].checked=defaults[x];
        }
    };




    DataCreator.prototype.addService = function(options) {
        var url = options.url;
        var type = options.type;
        var name = options.name;
        var layer;
        var re = /(?:\.([^.]+))?$/;
        var valid = 0;
        switch (type) {

            case 0:
                if ("geojson".search(new RegExp(re.exec(url)[1], "i")) !== -1) {
                    layer = this.addJson(url);
                    valid = 1;
                } else {
                    this.alert("<strong>Wrong extension!</strong> Try to select a .geojson file...");
                }
                break;
            case 1:
                if ("kml".search(new RegExp(re.exec(url)[1], "i")) !== -1) {
                    layer = this.addKml(url);
                    valid = 1;
                } else {
                    this.alert("<strong>Wrong extension!</strong> Try to select a .kml file...");
                }
                break;

            case 2:
                if ("tif".search(new RegExp(re.exec(url)[1], "i")) !== -1) {
                    layer = this.addGeoTiff(url);
                    valid = 1;
                } else {
                    this.alert("<strong>Wrong extension!</strong> Try to select a .geotiff file...");
                }
                break;
            case 3:
                if ("dae".search(new RegExp(re.exec(url)[1], "i")) !== -1) {
                    layer = this.addCollada(url);
                    valid = 1;
                } else {
                    this.alert("<strong>Wrong extension!</strong> Try to select a .dae file...");
                }
                break;


        }
        if (valid) {
            this.services.push(options);

            this.layers.push(layer);

            $("#services_list").append(
                "<div number=" + (this.layers.length - 1) + " class='listLayer'>Layer " +
                this.layers.length +
                ": " +
                this.types[type] +
                "<br>" +
                "Name: " +
                name +
                "<br><button type='button' class='btn btn-info' onClick='data.start(" +
                (this.layers.length - 1) + ")'>Go</button>" +
                "<button type='button' class='btn btn-info' onClick='data.remove(" +
                (this.layers.length - 1) + ")'>Remove</button></div>"
            );
        }

    };


    DataCreator.prototype.remove = function(number) {
        var self = this;
        this.wwd.removeLayer(self.layers[number]);

        $("#services_list").find("[number=" + number + "]").remove();

    };
    DataCreator.prototype.addCollada = function(url) {

        var modelLayer = new WorldWind.RenderableLayer("model");
        this.wwd.addLayer(modelLayer);


        var position = new WorldWind.Position(45, -100, 1000e3);
        var colladaLoader = new WorldWind.ColladaLoader(position);
        colladaLoader.init({
            filePath: url
        });

        colladaLoader.load(url, function(scene) {

            scene.scale = 8000;
            scene.localTransforms = true;
            scene.altitudeMode = WorldWind.ABSOLUTE;
            modelLayer.addRenderable(scene);
            modelScene = scene;

        });


        return modelLayer;

    };
    DataCreator.prototype.addGeoTiff = function(url) {


        var self = this;
        var geotiffObject = new WorldWind.GeoTiffReader(url);


        var geotiffLayer = new WorldWind.RenderableLayer("GeoTiff");
        this.wwd.addLayer(geotiffLayer);

        var geoTiffImage = geotiffObject.readAsImage(function(canvas) {

            var surfaceGeoTiff = new WorldWind.SurfaceImage(
                geotiffObject.metadata.bbox,
                new WorldWind.ImageSource(canvas)
            );

            geotiffLayer.addRenderable(surfaceGeoTiff);

        });

        return geotiffLayer;

    };
    DataCreator.prototype.addKml = function(url) {
        var self = this;
        var kmlFileOptions = {
            url: url
        };

        var kmlFilePromise = new KmlFile(kmlFileOptions);
        var renderableLayer = new WorldWind.RenderableLayer("Surface Shapes");
        kmlFilePromise.then(function(kmlFile) {

            self.wwd.addLayer(renderableLayer);

            kmlFile.update({
                layer: renderableLayer
            });
        });
        return renderableLayer;

    };

    DataCreator.prototype.addJson = function(url) {
        var self = this;
        var layer = new WorldWind.RenderableLayer("layer");
        var polygonGeoJSON = new WorldWind.GeoJSONParser(url);
        polygonGeoJSON.load(this.shapeConfigurationCallback, layer, function() {
            self.start(layer);
        }, 1);
        this.wwd.addLayer(layer);
        this.layer = layer;
        return layer;
    };


    DataCreator.prototype.start = function(layerNumber) {
        _self = this;

        var lat, lng;
        var layer = this.layers[layerNumber];
        var p = layer.renderables[0];
        try {
            if (p.position) {
                lng = p.position.longitude;
                lat = p.position.latitude;
            } else if (p.kmlGeometry) {
                lng = p.kmlGeometry.kmlPosition.longitude;
                lat = p.kmlGeometry.kmlPosition.latitude;
            } else if (p._boundaries) {
                lng = p._boundaries[0].longitude;
                lat = p._boundaries[0].latitude;
            } else {
                lat = p.sector.minLatitude + (p.sector.maxLatitude - p.sector.minLatitude) / 2;
                lng = p.sector.minLongitude + (p.sector.maxLongitude - p.sector.minLongitude) / 2;
            }

        } catch (e) {
            _self.alert("<strong>Load Not finished!</strong> wait few seconds and try again...");
            return;
        }
        var anim = new WorldWind.GoToAnimator(this.wwd);
        this.wwd.redraw();

        anim.goTo(new WorldWind.Position(lat, lng, 200000), function() {});
    };

    DataCreator.prototype.alert = function(text) {
        $("#alert").css("visibility", "visible");
        $("#alert").css("opacity", 1);
        $("#alertContent").html(text);
    };


    DataCreator.prototype.shapeConfigurationCallback = function(geometry, properties) {
        var placemarkAttributes = new WorldWind.PlacemarkAttributes(null);
        placemarkAttributes.imageScale = 1;
        placemarkAttributes.imageColor = WorldWind.Color.WHITE;
        placemarkAttributes.labelAttributes.offset = new WorldWind.Offset(
            WorldWind.OFFSET_FRACTION, 0.5,
            WorldWind.OFFSET_FRACTION, 1.5);
        placemarkAttributes.imageSource = WorldWind.configuration.baseUrl + "images/pushpins/castshadow-blue.png";
        var configuration = {};

        if (geometry.isPointType() || geometry.isMultiPointType()) {
            configuration.attributes = new WorldWind.PlacemarkAttributes(placemarkAttributes);

            if (properties && (properties.name || properties.Name || properties.NAME)) {
                configuration.name = properties.name || properties.Name || properties.NAME;
            }
            if (properties && properties.POP_MAX) {
                var population = properties.POP_MAX;
                configuration.attributes.imageScale = 0.01 * Math.log(population);
            }
        } else if (geometry.isLineStringType() || geometry.isMultiLineStringType()) {
            configuration.attributes = new WorldWind.ShapeAttributes(null);
            configuration.attributes.drawOutline = true;
            configuration.attributes.outlineColor = new WorldWind.Color(
                0.1 * configuration.attributes.interiorColor.red,
                0.3 * configuration.attributes.interiorColor.green,
                0.7 * configuration.attributes.interiorColor.blue,
                1.0);
            configuration.attributes.outlineWidth = 1.0;
        } else if (geometry.isPolygonType() || geometry.isMultiPolygonType()) {
            configuration.attributes = new WorldWind.ShapeAttributes(null);

            // Fill the polygon with a random pastel color.
            configuration.attributes.interiorColor = new WorldWind.Color(
                0.375 + 0.5 * Math.random(),
                0.375 + 0.5 * Math.random(),
                0.375 + 0.5 * Math.random(),
                0.1);
            // Paint the outline in a darker variant of the interior color.
            configuration.attributes.outlineColor = new WorldWind.Color(
                0.5 * configuration.attributes.interiorColor.red,
                0.5 * configuration.attributes.interiorColor.green,
                0.5 * configuration.attributes.interiorColor.blue,
                1.0);
        }

        return configuration;
    };


    return DataCreator;
});