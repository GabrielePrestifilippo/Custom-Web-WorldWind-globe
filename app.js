/*jshint -W117 */
var data;
define(['./scripts/Creator'], function(DataCreator) {

    data = new DataCreator("canvasOne");


    $("#type").change(function() {
        if ($("#type")[0].options[0].value == "-1") {
            $("#type")[0].options[0].remove();
        }

        var type = Number($("#type").val());
        var sample;
        switch (type) {
            case 0:
                sample = "http://worldwindserver.net/webworldwind/data/geojson-data/GeometryCollectionTest.geojson";
                break;
            case 1:
                sample = "https://raw.githubusercontent.com/NASAWorldWind/WebWorldWind/master/examples/data/KML_Samples.kml";
                break;
            case 2:
                sample = "cea.tif";
                break;
            case 3:
                sample = "custom/duck2.dae";
                break;



        }
        $("#url").val(sample);
        $("#name").val("SampleData");

    });


    $('#defaultLayers input:checkbox').change(function() {
        data.defaultLayers(Number(this.value), this.checked);
    });

    $("#saveButton").click(function() {
        data.save();
    });


    $("#loadButton").click(function() {
        $("#services_list").html("");
        data.clean();
        data.load();
    });



    $("#addRend").click(function() {

        var url = $("#url").val();
        var type = Number($("#type").val());
        var name = $("#name").val();



        data.addService({
            url: url,
            type: type,
            name: name
        });
    });
    
    
  
        var open = 0;
        $("#openOptions").click(function() {
            if (!open) {
                open = 1;
                $("#options").css("height", "400px");
            } else {
                open = 0;
                $("#options").css("height", "0px");
            }
        });



});