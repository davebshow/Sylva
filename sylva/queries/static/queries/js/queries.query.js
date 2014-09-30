/* Adapted from https://github.com/versae/qbe */

// Django i18n.
var gettext = window.gettext || String;

if (!diagram) {
    var diagram = {};
}

// Global variables for the query builder logic

diagram.Container = "diagram";
diagram.CurrentModels = [];
diagram.Counter = 0;
diagram.CounterRels = 0;
diagram.fieldCounter = 0;
diagram.fieldRelsCounter = 0;
diagram.nodetypesCounter = [];
diagram.nodetypesList = {};
diagram.reltypesCounter = [];
diagram.reltypesList = {};
diagram.fieldsForNodes = {};
diagram.fieldsForRels = {};
diagram.relindex = {};
diagram.boxesSelects = {};

/*
 * The next dictionaries are useful for the distinct options
 * in the lookups
 */

// Relationship between the string name and the key used in the backend

diagram.stringValues = {
    'em': gettext("matches"),
    'eq': gettext("equals"),
    'lte': gettext("is less than or equal to"),
    'lt': gettext("is less than"),
    'gt': gettext("is greater than"),
    'gte': gettext("is greater than or equal to"),
    'between': gettext("is between"),
    'neq': gettext("does not equal"),
    'isnotnull': gettext("has some value"),
    'isnull': gettext("has no value"),
    'icontains': gettext("contains"),
    'idoesnotcontain': gettext("doesn't contain"),
    'istartswith': gettext("starts with"),
    'iendswith': gettext("ends with")
};

diagram.lookupsBackendValues = {
    'equals': 'eq',
    'is less than or equal to': 'lte',
    'is less than': 'lt',
    'is greater than': 'gt',
    'is greater than or equal to': 'gte',
    'is between': 'between',
    'does not equal': 'neq',
    'has some value': 'isnotnull',
    'has no value': 'isnull',
    'contains': 'icontains',
    "doesn't contain": "idoesnotcontain",
    'starts with': 'istartswith',
    'ends with': 'iendswith'
}

// All the options for the lookups

diagram.lookupsAllValues = [
    diagram.stringValues['em'],
    diagram.stringValues['eq'],
    diagram.stringValues['lte'],
    diagram.stringValues['lt'],
    diagram.stringValues['gt'],
    diagram.stringValues['gte'],
    diagram.stringValues['between'],
    diagram.stringValues['neq'],
    diagram.stringValues['isnotnull'],
    diagram.stringValues['isnull'],
    diagram.stringValues['icontains'],
    diagram.stringValues['idoesnotcontain'],
    diagram.stringValues['istartswith'],
    diagram.stringValues['iendswith']
];

// Set of specific values for the lookups for the types boolean,
// choices, collaborator and auto_user

diagram.lookupsSpecificValues = [
    diagram.stringValues['em'],
    diagram.stringValues['eq'],
    diagram.stringValues['neq'],
    diagram.stringValues['isnotnull'],
    diagram.stringValues['isnull']
];

// Set of specific values for the lookups for the numeric types

diagram.lookupsNumberValues = [
    diagram.stringValues['em'],
    diagram.stringValues['eq'],
    diagram.stringValues['lte'],
    diagram.stringValues['lt'],
    diagram.stringValues['gt'],
    diagram.stringValues['gte'],
    diagram.stringValues['between'],
    diagram.stringValues['neq'],
    diagram.stringValues['isnotnull'],
    diagram.stringValues['isnull']
];

// Set of specific values for the lookups for the text and string types

diagram.lookupsTextValues = [
    diagram.stringValues['em'],
    diagram.stringValues['eq'],
    diagram.stringValues['neq'],
    diagram.stringValues['isnotnull'],
    diagram.stringValues['isnull'],
    diagram.stringValues['icontains'],
    diagram.stringValues['idoesnotcontain'],
    diagram.stringValues['istartswith'],
    diagram.stringValues['iendswith']
];

diagram.lookupsValuesType = {
    'default': diagram.lookupsAllValues,
    'string': diagram.lookupsTextValues,
    'boolean': diagram.lookupsSpecificValues,
    'number': diagram.lookupsNumberValues,
    'text': diagram.lookupsTextValues,
    'date': diagram.lookupsAllValues,
    'time': diagram.lookupsAllValues,
    'choices': diagram.lookupsSpecificValues,
    'float': diagram.lookupsNumberValues,
    'collaborator': diagram.lookupsSpecificValues,
    'auto_now': diagram.lookupsAllValues,
    'auto_now_add': diagram.lookupsAllValues,
    'auto_increment': diagram.lookupsNumberValues,
    'auto_increment_update': diagram.lookupsNumberValues,
    'auto_user': diagram.lookupsSpecificValues
};

diagram.aggregates = [
    "Count",
    "Max",
    "Min",
    "Sum",
    "Average",
    "Deviation"
];

(function($) {
    /**
      * AJAX Setup for CSRF Django token
      */
    $.ajaxSetup({
        beforeSend: function(xhr, settings) {
            function getCookie(name) {
                var cookieValue = null;
                if (document.cookie && document.cookie != '') {
                    var cookies = document.cookie.split(';');
                    for (var i = 0; i < cookies.length; i++) {
                        var cookie = jQuery.trim(cookies[i]);
                        // Does this cookie string begin with the name we want?
                        if (cookie.substring(0, name.length + 1) == (name + '=')) {
                            cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                            break;
                        }
                    }
                }
            return cookieValue;
            }
            if (!(/^http:.*/.test(settings.url) || /^https:.*/.test(settings.url))) {
                // Only send the token to relative URLs i.e. locally.
                xhr.setRequestHeader("X-CSRFToken", getCookie('csrftoken'));
            }
        }
    });

    init = function() {

        jsPlumb.Defaults.DragOptions = {cursor: 'pointer', zIndex: 2000};
        jsPlumb.Defaults.Container = diagram.Container;

        /**
         * Adds a new model box with its fields
         * - graphName
         * - modelName
         * - typeName
         */
        diagram.addBox = function (graphName, modelName, typeName) {
            var model, root, idBox, divBox, divAddBox, divContainerBoxes, divField, divFields, divManies, divAllowedRelationships, divAllRel, fieldName, field, countFields, idFields, boxAllRel, listRelElement, idAllRels, addField, addFieldIcon, idContainerBoxes, removeRelation, idTopBox, idBoxAllRels, selectAllRel;
            model = diagram.Models[graphName][typeName];
            root = $("#"+ diagram.Container);
            diagram.Counter++;
            idBox = "diagramBox-" + diagram.Counter +"-"+ typeName;
            idTopBox = "diagramTopBox-" + diagram.Counter + "-" + typeName;
            idFields = "diagramFields-" + diagram.Counter + "-" + typeName;
            idBoxAllRels = "diagramBoxAllRels-" + diagram.Counter + "-" + typeName;
            idAllRels = "diagramAllRel-" + diagram.Counter + "-" + typeName;
            idContainerBoxes = "diagramContainerBoxes-" + diagram.Counter + "-" + typeName;
            divBox = $("<DIV>");
            divBox.attr("id", idBox);
            divBox.css({
                "left": (parseInt(Math.random() * 55 + 1) * 10) + "px",
                "top": (parseInt(Math.random() * 25 + 1) * 10) + "px",
                "width": "360px"
            });
            divBox.addClass("body");
            // Allowed relationships
            // Select for the allowed relationships
            boxAllRel = $("<DIV>");
            boxAllRel.addClass("box-all-rel");
            boxAllRel.attr('id', idBoxAllRels);

            selectAllRel = $("<SELECT>");
            selectAllRel.addClass("select-rel");

            var relationsIds = [];
            if(typeName != "wildcard") {
                var relationsLength = model.relations.length;
                for(var i = 0; i < relationsLength; i++) {
                    var relation = model.relations[i];

                    // We only add the relations when the field is the source
                    if(typeName == relation.source) {
                        var label = relation.label;
                        var name = relation.name.replace(/-/g, "_");
                        var relationId = idBox + "-" + name;

                        var optionRel = $("<OPTION>");
                        optionRel.addClass("option-rel");
                        optionRel.attr('id', relationId);
                        optionRel.attr('value', name);
                        optionRel.attr('data-parentid', idBox);
                        optionRel.attr('data-boxrel', idBoxAllRels);
                        optionRel.attr('data-relsid', idAllRels);
                        optionRel.attr('data-relationid', relationId);
                        optionRel.attr('data-label', label);
                        optionRel.attr('data-name', name);
                        optionRel.attr('data-idrel', relation.id);
                        optionRel.attr('data-scope', relation.target);
                        optionRel.html(label + " (" + relation.target + ")");
                        diagram.fieldsForRels[name] = relation.fields;

                        if(relation.source) {
                            optionRel.attr("data-source", relation.source);
                            diagram.relindex[idBox] = 1;
                        }

                        relationsIds.push(relationId);

                        selectAllRel.append(optionRel);
                    }
                }
            }

            // Wildcard relationship
            var wildCardName = "WildcardRel";
            var wildCardRelId = idBox + "-" + "wildcard";

            // Option for the wildcard relationship
            var optionRelWildcard = $("<OPTION>");
            optionRelWildcard.addClass("option-rel");
            optionRelWildcard.attr('id', relationId);
            optionRelWildcard.attr('value', wildCardName);
            optionRelWildcard.attr('data-parentid', idBox);
            optionRelWildcard.attr('data-boxrel', idBoxAllRels);
            optionRelWildcard.attr('data-relsid', idAllRels);
            optionRelWildcard.attr('data-relationid', wildCardRelId);
            optionRelWildcard.attr('data-label', wildCardName);
            optionRelWildcard.attr('data-name', wildCardName);
            optionRelWildcard.attr('data-idrel', -1);
            optionRelWildcard.attr('data-scope', "wildcard");
            optionRelWildcard.html(wildCardName);
            diagram.fieldsForRels[wildCardName] = [];
            optionRelWildcard.attr("data-source", wildCardName);

            relationsIds.push(wildCardRelId);

            // This 'if' is to initialize the dictionary for
            // the wildcard box
            if(!diagram.relindex[idBox])
                diagram.relindex[idBox] = 1;

            selectAllRel.append(optionRelWildcard);

            // First option to choose one
            optionRelDefault = $("<OPTION>");
            optionRelDefault.addClass('option-rel');
            optionRelDefault.attr('value', '');
            optionRelDefault.attr('disabled', 'disabled');
            optionRelDefault.attr('selected', 'selected');
            optionRelDefault.html(gettext("choose one"));

            selectAllRel.prepend(optionRelDefault);

            boxAllRel.append(selectAllRel);

            divAllowedRelationships = $("<DIV>");
            divAllowedRelationships.attr("id", idAllRels);
            divAllowedRelationships.append(boxAllRel);
            // We append the divs
            divFields = $("<DIV>");
            divFields.attr("id", idFields);
            divFields.css({
                "margin-top": "10px",
                "margin-bottom": "10px"
            });
            countFields = 0;

            divTitle = diagram.addTitleDiv(graphName, model, typeName, modelName, idTopBox, idBox, idAllRels, relationsIds);
            // Create the select for the properties
            var boxalias = divTitle.data('boxalias');
            diagram.fieldsForNodes[boxalias] = [];
            divField = diagram.addFieldRow(graphName, typeName, idFields, typeName, boxalias, idBox, idAllRels);
            divFields.append(divField);
            if (countFields < 5 && countFields > 0) {
                divFields.addClass("noOverflow");
            } else if (countFields > 0) {
                divFields.addClass("fieldsContainer");
            }
            if (divManies) {
                divBox.append(divManies);
            }
            // Link to add a new row
            addField = $("<A>");
            addField.addClass("add-field-row");
            addField.attr("data-parentid", idFields);
            addField.attr("data-graph", graphName);
            addField.attr("data-model", typeName);
            addField.attr("data-typename", typeName);
            addField.attr("data-boxalias", boxalias);
            addField.attr("data-idbox", idBox);
            addField.attr("data-idallrels", idAllRels);
            // Icon
            addFieldIcon = $("<I>");
            addFieldIcon.addClass("fa fa-plus-circle");
            addFieldIcon.attr('id', 'add-field-icon');
            addField.append(addFieldIcon);
            divAddBox = $("<DIV>");
            divAddBox.attr("id", idTopBox);
            divAddBox.append(divFields);

            divAddBox.css({
                "border-bottom": "2px dashed #348E82"
            });
            divContainerBoxes = $("<DIV>");
            divContainerBoxes.attr("id", idContainerBoxes);
            divContainerBoxes.append(divAddBox);
            divContainerBoxes.append(divAllowedRelationships);

            divBox.append(divContainerBoxes);
            divBox.prepend(divTitle);
            root.append(divBox);

            // We add the target relationship handler
            var exampleDropOptions = {
                tolerance:"touch",
                hoverClass:"dropHover",
                activeClass:"dragActive"
            }
            var uuidTarget = idBox + "-target";
            if(!jsPlumb.getEndpoint(uuidTarget)) {
                // This offset is for centering the endpoint
                var offset = 7;
                var anchor = ($('#' + idBox).height() - $('#' + idBox + ' .title').height() + offset) / $('#' + idBox).height()
                var endpointTarget = jsPlumb.addEndpoint(idBox, { uuid:uuidTarget, connector: "Flowchart"},diagram.getRelationshipOptions('target', 0, 0, 1 - anchor));
                endpointTarget.addClass("endpoint-target");
                endpointTarget.scopeTarget = typeName;
            }
            jsPlumb.draggable("diagramBox-"+ diagram.Counter +"-"+ typeName, {
                handle: ".title",
                grid: [10, 10],
                stop: function (event, ui) {
                    var $this, position, left, top;
                    $this = $(this);
                    position = $this.position()
                    left = position.left;
                    if (position.left < 0) {
                        left = "0px";
                    }
                    if (position.top < 0) {
                        top = "0px";
                    }
                }
            });
        };

        /**
         * Add a box for the relation. In this case, we implement
         * the title part and the main box part in the same
         * function
         * - name
         * - label
         * - idRel
         */
        diagram.addRelationBox = function(name, label, idRel) {
            var divTitle, selectReltype, optionReltype, checkboxType, anchorShowHide, iconToggle, anchorDelete, iconDelete;

            var model, root, idBox, divBox, divAddBox, divContainerBoxes, divField, divFields, divAllowedRelationships, fieldName, field, countFields, idFields, boxAllRel, listRelElement, idAllRels, addField, addFieldIcon, idContainerBoxes, removeRelation, idTopBox;

            root = $("#"+ diagram.Container);
            idBox = "diagramBoxRel-" + diagram.CounterRels + "-" + name;
            idTopBox = "diagramTopBoxRel-" + diagram.CounterRels + "-" + name;
            idFields = "diagramFieldsRel-" + diagram.CounterRels + "-" + name;
            idAllRels = "diagramAllRelRel-" + diagram.CounterRels + "-" + name;
            idContainerBoxes = "diagramContainerBoxesRel-" + diagram.CounterRels + "-" + name;
            /*
             *  Title part
             */

            if(diagram.reltypesCounter[name] >= 0) {
                diagram.reltypesCounter[name]++;
            } else {
                diagram.reltypesCounter[name] = 0;
            }

            divTitle = $("<DIV>");
            divTitle.addClass("title");
            divTitle.css({
                "background-color": "#AEAA78"
            });
            divTitle.attr("id", idBox + "-title");
            divTitle.attr("data-modelid", idRel);
            // Select for the type
            selectReltype = $("<SELECT>");
            selectReltype.addClass("select-reltype-" + name);
            selectReltype.css({
                "width": "65px",
                "float": "left",
                "padding": "0",
                "margin-left": "5%",
                "margin-top": "-1px",
                "display": "none"
            });
            relValue = label + " " + diagram.reltypesCounter[name];
            optionReltype = $("<OPTION>");
            optionReltype.addClass("option-reltype-" + name);
            optionReltype.attr('id', name + diagram.reltypesCounter[name]);
            optionReltype.attr('value', relValue);
            optionReltype.attr('data-modelid', idRel);
            optionReltype.html(relValue);
            // This for loop is to add the new option in the old boxes
            for(var i = 0; i < diagram.reltypesCounter[name]; i++) {
                $($('.select-reltype-' + name)[i]).append(optionReltype.clone(true));
            }
            // This for loop is to include the old options in the new box
            var typeBoxesLength = diagram.reltypesList[name].length;
            for(var i = 0; i < typeBoxesLength; i++) {
                var alias = diagram.reltypesList[name][i];
                var id = alias.replace(/\s/g, '');;
                selectReltype.append("<option class='option-reltype-" + name + "' id='" + id + "' value='" + alias +"' data-modelid='" + idRel + "' selected=''>" + alias + "</option>");
            }
            // We add the new alias to the list of the reltype
            diagram.reltypesList[name].push(relValue);
            selectReltype.append(optionReltype);
            diagram.setName(divTitle, label, name, "relation");

            // Show/hide button in the corner of the box and its associated event
            anchorShowHide = $("<A>");
            anchorShowHide.attr("href", "javascript:void(0);");
            anchorShowHide.attr("id", "inlineShowHideLink_"+ name);
            iconToggle = $("<I>");
            iconToggle.addClass("fa fa-plus-circle icon-style");
            iconToggle.css({
                'margin-right': '4px'
            });
            iconToggle.attr('id', 'icon-toggle');

            anchorShowHide.append(iconToggle);
            anchorShowHide.click(function () {
                $('#' + idFields).toggleClass("hidden");
                if (iconToggle.attr('class') == 'fa fa-plus-circle icon-style') {
                    iconToggle.removeClass('fa fa-plus-circle icon-style');
                    iconToggle.addClass('fa fa-minus-circle icon-style');
                    $('#' + idBox).css({
                        'width': '360px'
                    });
                    // We change the width of the select field
                    $('#' + idBox + ' .select-reltype-' + name).css({
                        'width': '46%'
                    });
                    // We show the advanced mode button
                    $('#' + idBox + ' #inlineAdvancedMode_' + name).css({
                        'display': 'inline'
                    });
                } else {
                    iconToggle.removeClass('fa fa-minus-circle icon-style');
                    iconToggle.addClass('fa fa-plus-circle icon-style');
                    $('#' + idBox).css({
                        'width': '195px'
                    });
                    // We change the width of the select field
                    $('#' + idBox + ' .select-reltype-' + name).css({
                        'width': '65px'
                    });
                    // We hide the advanced mode button and the select
                    $('#' + idBox + ' #inlineAdvancedMode_' + name).css({
                        'display': 'none'
                    });
                    $('#' + idBox + ' .select-aggregate').css({
                        'display': 'none'
                    });
                }
            });
            // Advanced mode button in the corner of the box and its associated event
            anchorAdvancedMode = $("<A>");
            anchorAdvancedMode.attr("href", "javascript:void(0);");
            anchorAdvancedMode.attr("id", "inlineAdvancedMode_" + name);
            anchorAdvancedMode.attr("title", gettext("Advanced options"))
            anchorAdvancedMode.css({
                'display': 'none'
            });
            iconAdvancedMode = $("<I>");
            iconAdvancedMode.addClass("fa fa-gear icon-style");
            anchorAdvancedMode.append(iconAdvancedMode);
            anchorAdvancedMode.click(function () {
                var display = $('#' + idBox + " .select-aggregate").css('display');
                var selectorBox = '#' + idBox;
                var selectorAggregate = '#' + idBox + " .select-aggregate";
                var selectorRemoveRelation = '#' + idBox + " #remove-relation-icon";
                if(display == "none") {
                    // We change the width of the box div
                    $(selectorBox).css({
                        'width': '440px'
                    });
                    // We show the advanced options
                    $(selectorAggregate).css({
                        "display": "inline"
                    });
                    // We change the margin left of the relationships remove icon
                    $(selectorRemoveRelation).css({
                        'margin-left': '307px'
                    });
                } else {
                    // We change the width of the box div
                    $(selectorBox).css({
                        'width': '360px'
                    });
                    // We show the advanced options
                    $(selectorAggregate).css({
                        "display": "none"
                    });
                    // We change the margin left of the relationships remove icon
                    $(selectorRemoveRelation).css({
                        'margin-left': '234px'
                    });
                    // We change the value of the aggregate
                    $(selectorAggregate).val('');
                }
            });

            anchorEditSelect = $("<A>");
            anchorEditSelect.attr("href", "javascript:void(0);");
            anchorEditSelect.attr("id", "inlineEditSelect_"+ name);
            anchorEditSelect.attr("title", gettext("Edit alias name"));
            anchorEditSelect.css({
                'display': 'none',
                'margin-right': '4px'
            });
            iconEditSelect = $("<I>");
            iconEditSelect.addClass("fa fa-pencil icon-style");
            anchorEditSelect.append(iconEditSelect);
            anchorEditSelect.click(function () {
                if(iconEditSelect.attr('class') == 'fa fa-pencil icon-style') {
                    iconEditSelect.removeClass('fa fa-pencil icon-style');
                    iconEditSelect.addClass('fa fa-undo icon-style');
                    var selectorAlias = '#' + idBox + " .select-reltype-" + name;
                    // We store the select for the type
                    selectorObject = $(selectorAlias)[0];
                    diagram.boxesSelects[idBox] = selectorObject;
                    // We get the select value
                    var selectValue = $(selectorAlias).val();
                    // We replace the selectAlias with the input for the user
                    var inputAlias = $("<INPUT>");
                    var classesInput = "option-nodetype-" + name + " edit-alias";
                    inputAlias.addClass(classesInput);
                    // This attr is for the logical to get the fields for the query
                    inputAlias.attr("selected", "selected");
                    inputAlias.attr("data-modelid", idRel);
                    inputAlias.attr("data-oldvalue", selectValue);
                    inputAlias.attr("data-typename", name);
                    inputAlias.css({
                        "width": "60px",
                        "float": "left",
                        "padding": "0",
                        "margin-left": "5%",
                        "margin-top": "-1px"
                    });
                    $(selectorAlias).replaceWith(inputAlias);
                } else {
                    iconEditSelect.removeClass('fa fa-undo icon-style');
                    iconEditSelect.addClass('fa fa-pencil icon-style');
                    // We get the select for the type and the input
                    var inputSelector = '#' + idBox + " .edit-alias";
                    var selectorAlias = diagram.boxesSelects[idBox];
                    var inputAlias = $(inputSelector);
                    $(inputAlias).replaceWith(selectorAlias);
                }
            });
            // We create the div for the corner buttons
            divCornerButtons = $("<DIV>");
            divCornerButtons.addClass("corner-buttons");

            /*
             *  Box part
             */

            divBox = $("<DIV>");
            divBox.attr("id", idBox);
            divBox.css({
                "left": (parseInt(Math.random() * 55 + 1) * 10) + "px",
                "top": (parseInt(Math.random() * 25 + 1) * 10) + "px",
                "width": "195px",
                "background-color": "white",
                "border": "2px solid #AEAA78"
            });
            divBox.addClass("body");
            // Allowed relationships
            // Select for the allowed relationships
            boxAllRel = $("<DIV>");
            boxAllRel.addClass("box-all-rel");
            // We append the divs
            divFields = $("<DIV>");
            divFields.addClass("hidden");
            divFields.attr("id", idFields);
            countFields = 0;
            if(diagram.fieldsForRels[name].length > 0) {
                // If we have properties, we add the button to
                // minimize/maximize the box
                divCornerButtons.append(anchorShowHide);
                divCornerButtons.append(anchorAdvancedMode);
                // Create the select for the properties
                divField = diagram.addFieldRelRow(name, idFields);
                divFields.append(divField);
                if (countFields < 5 && countFields > 0) {
                    divFields.addClass("noOverflow");
                } else if (countFields > 0) {
                    divFields.addClass("fieldsContainer");
                }
                // We check if there are fields for add more
                if(divFields.children() > 0) {
                    // Link to add a new row
                    addField = $("<A>");
                    addField.addClass("add-field-row-rel");
                    addField.attr('data-parentid', idFields);
                    addField.attr('data-label', name);
                    // Icon
                    addFieldIcon = $("<I>");
                    addFieldIcon.addClass("fa fa-plus-circle");
                    addFieldIcon.attr('id', 'add-field-icon-prop')
                    addField.append(addFieldIcon);
                }
            }
            divCornerButtons.append(anchorEditSelect);
            divAddBox = $("<DIV>");
            divAddBox.append(divFields);
            divAddBox.append(addField);
            divContainerBoxes = $("<DIV>");
            divContainerBoxes.attr("id", idContainerBoxes);
            divContainerBoxes.append(divAddBox);
            divContainerBoxes.append(divAllowedRelationships);

            divTitle.append(selectReltype);
            divTitle.append(divCornerButtons);

            divBox.append(divContainerBoxes);
            divBox.prepend(divTitle);

            return divBox;
        };

        /**
         * Set all the neccesary to create the title div
         * - graphName
         * - model
         * - typeName
         * - modelName
         * - idTopBox
         * - idBox
         * - idAllRels
         * - relationsIds
         */
        diagram.addTitleDiv = function(graphName, model, typeName, modelName, idTopBox, idBox, idAllRels, relationsIds) {
            var divTitle, selectNodetype, optionNodetype, checkboxType, anchorShowHide, iconToggle, anchorDelete, iconDelete;

            // We check if the typeName is not "wildcard" to change the modelid
            var typeId = -1;
            if(typeName != "wildcard") {
                typeId = model.id;
            }
            divTitle = $("<DIV>");
            divTitle.addClass("title");
            divTitle.attr('id', idBox + "-title");
            divTitle.attr('data-modelid', typeId);
            // Select for the type
            selectNodetype = $("<SELECT>");
            selectNodetype.addClass("select-nodetype-" + typeName);
            selectNodetype.css({
                "width": "46%",
                "float": "left",
                "padding": "0",
                "margin-left": "10%",
                "margin-top": "-1px",
                "display": "none"
            });
            optionNodetype = $("<OPTION>");
            var idAndValue = modelName + diagram.nodetypesCounter[typeName];
            var boxAlias = modelName + " " + diagram.nodetypesCounter[typeName];
            optionNodetype.addClass("option-nodetype-" + typeName);
            optionNodetype.attr('id', idAndValue);
            optionNodetype.attr('data-modelid', typeId);
            optionNodetype.attr('value', boxAlias);
            optionNodetype.html(boxAlias);
            // This 'for' loop is to add the new option in the old boxes
            for(var i = 0; i < diagram.nodetypesCounter[typeName]; i++) {
                $($('.select-nodetype-' + typeName)[i]).append(optionNodetype.clone(true));
            }
            // This 'for' loop is to include the old options in the new box
            var typeBoxesLength = diagram.nodetypesList[typeName].length;
            for(var i = 0; i < typeBoxesLength; i++) {
                var alias = diagram.nodetypesList[typeName][i];
                var id = alias.replace(/\s/g, '');;
                selectNodetype.append("<option class='option-nodetype-" + typeName + "' id='" + id + "' data-modelid='" + typeId + "' value='" + alias +"' selected=''>" + alias + "</option>");
            }
            // We add the new alias to the list of the nodetype
            diagram.nodetypesList[typeName].push(boxAlias);
            selectNodetype.append(optionNodetype);
            diagram.setName(divTitle, modelName, typeName, "node");
            divTitle.append(selectNodetype);
            // Show/hide button in the corner of the box and its associated event
            anchorShowHide = $("<A>");
            anchorShowHide.attr("href", "javascript:void(0);");
            anchorShowHide.attr("id", "inlineShowHideLink_"+ typeName);
            iconToggle = $("<I>");
            iconToggle.addClass("fa fa-minus-circle icon-style");
            iconToggle.attr('id', 'icon-toggle');

            anchorShowHide.append(iconToggle);
            anchorShowHide.click(function () {
                $('#' + idTopBox).toggleClass("hidden");
                if (iconToggle.attr('class') == 'fa fa-minus-circle icon-style') {
                    iconToggle.removeClass('fa fa-minus-circle icon-style');
                    iconToggle.addClass('fa fa-plus-circle icon-style');
                } else {
                    iconToggle.removeClass('fa fa-plus-circle icon-style');
                    iconToggle.addClass('fa fa-minus-circle icon-style');
                }
                // Recalculate anchor for source endpoints
                diagram.recalculateAnchor(idBox, idAllRels);

                jsPlumb.repaintEverything();
            });
            // Close button in the corner of the box and its associated event
            anchorClose = $("<A>");
            anchorClose.attr("href", "javascript:void(0);");
            anchorClose.attr("id", "inlineDeleteLink_"+ typeName);

            iconClose = $("<I>");
            iconClose.addClass("fa fa-times-circle icon-style");

            anchorClose.append(iconClose);
            anchorClose.click(function () {
                var connections = jsPlumb.getEndpoint(idBox + '-target').connections;
                // We redraw the endpoint of the endpoints connected to this
                // target
                for(var i = 0; i < connections.length; i++) {
                    connections[i].endpoints[0].removeClass('endpointInvisible');
                }

                // We gonna check if we have to hide the alias select of the relationship boxes
                var boxEndpoints = jsPlumb.getEndpoints(idBox);
                // We gonna save the names of the relationships
                var relNamesArray = new Array();
                // We gonna save the ids of the relationship boxes
                var relIdsArray = {};
                $.each(boxEndpoints, function(id, endpoint) {
                    if(endpoint.isSource) {
                        // It is the name, dont confuse with the label
                        var name = endpoint.connectorOverlays[1][1].label;
                        var idRelBox = endpoint.connectorOverlays[2][1].id;
                        relNamesArray.push(name);
                        relIdsArray[name] = idRelBox;
                    }
                });

                // We check if we have to remove some alias of the relationship selects
                $.each(relIdsArray, function(name, idRel) {
                    var boxAlias = $('#' + idRel + ' .select-reltype-' + name).val();
                    // We remove the boxAlias in the other selects
                    diagram.removeAlias(name, boxAlias, "relationship");

                    // We remove the boxAlias of the list
                    var aliasIndex = diagram.reltypesList[name].indexOf(boxAlias);
                    diagram.reltypesList[name].splice(aliasIndex, 1);
                });

                // We detach all the connections
                jsPlumb.detachAllConnections(idBox);
                for(var i = 0; i < relationsIds.length; i++)
                    jsPlumb.deleteEndpoint(relationsIds[i] + "-source");
                jsPlumb.deleteEndpoint(idBox + "-target");

                // We check if we have to hide the selects of some relationships boxes
                $.each(relNamesArray, function(id, name) {
                    diagram.hideSelects(name, "relationship");
                });

                // We get the alias of the box to remove it in the selects
                var boxAlias = $('#' + idBox + ' .select-nodetype-' + typeName).val();

                $('#' + idBox).remove();

                // We remove the boxAlias in the other selects
                diagram.removeAlias(typeName, boxAlias, "node");

                // We remove the boxAlias of the list
                var aliasIndex = diagram.nodetypesList[typeName].indexOf(boxAlias);
                diagram.nodetypesList[typeName].splice(aliasIndex, 1);

                // We check if we have only one box to hide the selects for the alias
                diagram.hideSelects(typeName, "node");
            });
            // We create the div for the corner buttons
            divCornerButtons = $("<DIV>");
            divCornerButtons.addClass("corner-buttons");
            // Advanced mode button in the corner of the box and its associated event
            anchorAdvancedMode = $("<A>");
            anchorAdvancedMode.attr("href", "javascript:void(0);");
            anchorAdvancedMode.attr("id", "inlineAdvancedMode_"+ typeName);
            anchorAdvancedMode.attr("title", gettext("Advanced options"));

            var iconAdvancedMode = $("<I>");
            iconAdvancedMode.addClass("fa fa-gear icon-style");

            anchorAdvancedMode.append(iconAdvancedMode);
            anchorAdvancedMode.click(function () {
                var display = $('#' + idBox + " .select-aggregate").css('display');
                var selectorBox = '#' + idBox;
                var selectorAggregate = '#' + idBox + " .select-aggregate";
                var selectorRemoveRelation = '#' + idBox + " #remove-relation-icon";
                if(display == "none") {
                    // We change the width of the box div
                    $(selectorBox).css({
                        'width': '440px'
                    });
                    // We show the advanced options
                    $(selectorAggregate).css({
                        "display": "inline"
                    });
                    // We change the margin left of the relationships remove icon
                    $(selectorRemoveRelation).css({
                        'margin-left': '307px'
                    });
                } else {
                    // We change the width of the box div
                    $(selectorBox).css({
                        'width': '360px'
                    });
                    // We show the advanced options
                    $(selectorAggregate).css({
                        "display": "none"
                    });
                    // We change the margin left of the relationships remove icon
                    $(selectorRemoveRelation).css({
                        'margin-left': '234px'
                    });
                    // We change the value of the aggregate
                    $(selectorAggregate).val('');
                }

                jsPlumb.repaintEverything();
            });
            anchorEditSelect = $("<A>");
            anchorEditSelect.attr("href", "javascript:void(0);");
            anchorEditSelect.attr("id", "inlineEditSelect_"+ typeName);
            anchorEditSelect.attr("title", gettext("Edit alias name"));
            anchorEditSelect.css({
                'display': 'none'
            });

            var iconEditSelect = $("<I>");
            iconEditSelect.addClass("fa fa-pencil icon-style");

            anchorEditSelect.append(iconEditSelect);
            anchorEditSelect.click(function () {
                if(iconEditSelect.attr('class') == 'fa fa-pencil icon-style') {
                    iconEditSelect.removeClass('fa fa-pencil icon-style');
                    iconEditSelect.addClass('fa fa-undo icon-style');
                    var selectorAlias = '#' + idBox + " .select-nodetype-" + typeName;
                    // We store the select for the type
                    selectorObject = $(selectorAlias)[0];
                    diagram.boxesSelects[idBox] = selectorObject;
                    // We get the select value for next comparisons
                    var selectValue = $(selectorAlias).val();
                    // We replace the selectAlias with the input for the user
                    var inputAlias = $("<INPUT>");
                    var classesInput = "option-nodetype-" + typeName + " edit-alias";
                    inputAlias.addClass(classesInput);
                    // This attr is for the logical to get the fields for the query
                    inputAlias.attr("selected", "selected");
                    inputAlias.attr("data-modelid", typeId);
                    inputAlias.attr("data-oldvalue", selectValue);
                    inputAlias.attr("data-typename", typeName);
                    inputAlias.css({
                        "width": "36%",
                        "float": "left",
                        "padding": "0",
                        "margin-left": "10%",
                        "margin-top": "-1px"
                    });
                    $(selectorAlias).replaceWith(inputAlias);
                } else {
                    iconEditSelect.removeClass('fa fa-undo icon-style');
                    iconEditSelect.addClass('fa fa-pencil icon-style');
                    // We get the select for the type and the input
                    var inputSelector = '#' + idBox + " .edit-alias";
                    var selectorAlias = diagram.boxesSelects[idBox];
                    var inputAlias = $(inputSelector);
                    $(inputAlias).replaceWith(selectorAlias);
                }
            });

            divCornerButtons.append(anchorClose);
            divCornerButtons.append(anchorShowHide);
            divCornerButtons.append(anchorAdvancedMode);
            divCornerButtons.append(anchorEditSelect);

            divTitle.append(divCornerButtons);
            divTitle.attr("data-boxalias", boxAlias);

            return divTitle;
        };

        /**
         * Set the label fo the fields getting shorter and adding ellipsis
         */
        diagram.setLabel = function (div, label) {
            div.html(label);
            if (label.length > 5) {
                div.html(label.substr(0, 20) +"…");
            }
            div.attr("title", label);
            div.attr("alt", label);

            return div;
        };

        /**
         * Set the name fo the model box getting shorter and adding ellipsis
         */
        diagram.setName = function (div, name, typeName, type) {
            // We check if we show the select to allow more space for the name
            var numOfBoxes = $('.select-nodetype-' + typeName).length;
            var selectorForName = $('.select-nodetype-' + typeName);
            if(type == "relation") {
                // If the name is equals to the typeName, is a relationship
                numOfBoxes =  $('.select-reltype-' + typeName).length;
                selectorForName = $('.select-reltype-' + typeName);
            }
            var html = "<span class='box-name'>" + name + " <span class='show-as'>" + gettext("as") + "</span></span>";
            if(numOfBoxes == 1) {
                if(name.length > 5) {
                    html = "<span class='box-name'>" + name.substr(0, 5) + "…" + " <span class='show-as'>" + gettext("as") + "</span></span>";
                    // We change the name of the box number 0 too
                    var firstBoxName = selectorForName.prev();
                    firstBoxName.replaceWith(html);
                }
            } else if(numOfBoxes > 1) {
                if(name.length > 5) {
                    html = "<span class='box-name'>" + name.substr(0, 5) + "…" + " <span class='show-as'>" + gettext("as") + "</span></span>";
                }
            } else {
                // We allow more space
                if(name.length > 25) {
                    html = "<span class='box-name'>" + name.substr(0, 25) + "…" + " <span class='show-as'>" + gettext("as") + "</span></span>";
                }
            }
            div.append(html);
            return div;
        };

        /**
         * Load the node type from the schema
         * - typeName
         */
        diagram.loadBox = function(typeName) {
            var graph, models, modelName;
            var modelNameValue = "";
            if (diagram.Models) {
                for(graph in diagram.Models) {
                    models = diagram.Models[graph];
                    for(modelName in models) {
                        if(modelName.localeCompare(typeName) == 0) {
                            // Node type counter for the node type select field
                            if(diagram.nodetypesCounter[typeName] >= 1) {
                                diagram.nodetypesCounter[typeName]++;
                            } else {
                                diagram.nodetypesCounter[typeName] = 1;
                                diagram.nodetypesList[typeName] = new Array();
                            }

                            modelNameValue = models[modelName].name;
                            diagram.addBox(graph, modelNameValue, typeName);
                        }
                    }
                    if(typeName == "wildcard") {
                        // Node type counter for the node type select field
                        if(diagram.nodetypesCounter[typeName] >= 1) {
                            diagram.nodetypesCounter[typeName]++;
                        } else {
                            diagram.nodetypesCounter[typeName] = 1;
                            diagram.nodetypesList[typeName] = new Array();
                        }

                        modelNameValue = "Wildcard";
                        diagram.addBox(graph, modelNameValue, typeName);
                    }
                }
            }

            return modelNameValue;
        };

        /**
         * Add a new row for a field in a box
         * - graphName
         * - modelName
         * - parentId
         * - typeName
         * - boxalias
         * - idBox
         * - idAllRels
         */
        diagram.addFieldRow = function(graphName, modelName, parentId, typeName, boxalias, idBox, idAllRels) {
            var model, lengthFields, fieldId, selectProperty, selectLookup, field, datatype, optionProperty, inputLookup, divField, divAndOr, selectAndOr, removeField, removeFieldIcon, checkboxProperty;
            model = diagram.Models[graphName][typeName];
            diagram.fieldCounter++;
            fieldId = "field" + diagram.fieldCounter;
            diagram.fieldsForNodes[boxalias].push(fieldId);
            if(typeName != "wildcard") {
                lengthFields = model.fields.length;
                // Select property
                selectProperty = $("<SELECT>");
                selectProperty.addClass("select-property");
                selectProperty.css({
                    "width": "80px"
                });
                selectProperty.attr('data-fieldid', fieldId);
                selectProperty.attr('data-boxalias', boxalias);
                // First option to choose one
                optionProperty = $("<OPTION>");
                optionProperty.addClass('option-property');
                optionProperty.attr('value', 'undefined');
                optionProperty.attr('disabled', 'disabled');
                optionProperty.attr('selected', 'selected');
                optionProperty.html(gettext("choose one"));
                selectProperty.append(optionProperty);

                // We get the values for the properties select and the values
                // for the lookups option in relation with the datatype
                for(var fieldIndex = 0; fieldIndex < lengthFields; fieldIndex++) {
                    field = model.fields[fieldIndex];
                    datatype = field.type;
                    optionProperty = $("<OPTION>");
                    optionProperty.addClass('option-property');
                    optionProperty.attr('value', field.label);
                    optionProperty.attr('data-datatype', field.type);
                    if(field.choices)
                        optionProperty.attr('data-choices', field.choices);
                    optionProperty.html(field.label);
                    selectProperty.append(optionProperty);
                }
                // Select lookup
                selectLookup = $("<SELECT>");
                selectLookup.addClass("select-lookup");
                selectLookup.css({
                    "width": "80px"
                });
            } else {
                // We add an input field to get the return value
                selectProperty = $("<INPUT>");
                selectProperty.addClass("wildCardInput select-property");
                selectProperty.attr('id', fieldId);
                selectProperty.attr('data-fieldid', fieldId);
                // Select lookup
                selectLookup = $("<SELECT>");
                selectLookup.addClass("select-lookup");
                selectLookup.css({
                    "width": "80px"
                });
            }

            divField = $("<DIV>");
            divField.addClass("field");
            divField.attr('id', fieldId);
            // Checkbox for select property
            checkboxProperty = $("<INPUT>");
            checkboxProperty.addClass("checkbox-property");
            checkboxProperty.attr("type", "checkbox");
            // Add and-or div
            divAndOr = $("<DIV>");
            divAndOr.addClass("and-or-option");
            divAndOr.css({
                'display': 'inline'
            });
            selectAndOr = $("<SELECT>");
            selectAndOr.addClass("select-and-or");
            selectAndOr.attr('data-parentid', parentId);
            selectAndOr.attr('data-model', modelName);
            selectAndOr.attr('data-graph', graphName);
            selectAndOr.attr('data-typename', typeName);
            selectAndOr.attr('data-boxalias', boxalias);
            selectAndOr.attr('data-idbox', idBox);
            selectAndOr.attr('data-idallrels', idAllRels);
            selectAndOr.append("<option class='option-and-or' value='not' selected='selected' disabled>" + gettext("choose one") + "</option>");
            selectAndOr.append("<option class='option-and-or' value='and'>" + gettext("And") + "</option>");
            selectAndOr.append("<option class='option-and-or' value='or'>" + gettext("Or") + "</option>");
            divAndOr.append(selectAndOr);

            // Link to remove the lookup
            removeField = $("<A>");
            removeField.addClass("remove-field-row");
            removeField.attr('data-fieldid', fieldId);
            removeField.attr('data-parentid', parentId);
            removeField.attr('data-idbox', idBox);
            removeField.attr('data-idallrels', idAllRels);
            // Icon
            removeFieldIcon = $("<I>");
            removeFieldIcon.addClass("fa fa-minus-circle");
            removeFieldIcon.attr('id', 'remove-field-icon');
            removeField.append(removeFieldIcon);

            // Select for the aggregates elements
            selectAggregate = $("<SELECT>");
            selectAggregate.addClass("select-aggregate");
            // We check if we have other aggregates visibles
            displayAggregates = $("#" + idBox + " .select-aggregate").css('display');
            selectAggregate.css({
                'display': displayAggregates
            })
            selectAggregate.append("<option class='option-aggregate' value='' selected='selected' disabled>" + gettext("choose one") + "</option>");
            for(var i = 0; i < diagram.aggregates.length; i++) {
                // We append the aggregate and the aggregate Distinct
                var aggregate = diagram.aggregates[i];
                var aggregateDistinct = aggregate + " distinct";
                selectAggregate.append("<option class='option-aggregate' value='" + aggregate + "' data-distinct='false'>" + gettext(aggregate) + "</option>");
                selectAggregate.append("<option class='option-aggregate' value='" + aggregate + "' data-distinct='true'>" + gettext(aggregateDistinct) + "</option>");
            }
            // We append the patterns
            divField.append(checkboxProperty);
            divField.append(selectAggregate);
            divField.append(selectProperty);
            divField.append(selectLookup);
            divField.append(divAndOr);
            divField.append(removeField);

            return divField;
        };

        /**
         * Add a new row for a field in a rel box
         * - label
         * - idFields
         */
        diagram.addFieldRelRow = function(label, idFields) {
            var model, lengthFields, fieldId, selectProperty, selectLookup, field, datatype, optionProperty, inputLookup, divField, divAndOr, selectAndOr, removeField, removeFieldIcon, checkboxProperty;
            var fields = diagram.fieldsForRels[label];
            lengthFields = fields.length;
            diagram.fieldRelsCounter++;
            fieldId = "field-" + diagram.fieldRelsCounter + "-" + label;
            divField = $("<DIV>");
            divField.addClass("field");
            divField.css({
                "margin-top": "14px"
            });
            divField.attr('id', fieldId);
            // We check if there are fields
            if(lengthFields > 0) {
                // Select property
                selectProperty = $("<SELECT>");
                selectProperty.addClass("select-property");
                selectProperty.attr('data-fieldid', fieldId);
                // First option to choose one
                optionProperty = $("<OPTION>");
                optionProperty.addClass('option-property');
                optionProperty.attr('value', '');
                optionProperty.attr('disabled', 'disabled');
                optionProperty.attr('selected', 'selected');
                optionProperty.html(gettext("choose one"));
                selectProperty.append(optionProperty);
                // Select lookup
                selectLookup = $("<SELECT>");
                selectLookup.addClass("select-lookup");
                // We get the values for the properties select and the values
                // for the lookups option in relation with the datatype
                for(var fieldIndex = 0; fieldIndex < lengthFields; fieldIndex++) {
                    field = fields[fieldIndex];
                    datatype = field.type;
                    optionProperty = $("<OPTION>");
                    optionProperty.addClass('option-property');
                    optionProperty.attr('value', field.label);
                    optionProperty.attr('data-datatype', field.type);
                    if(field.choices)
                        optionProperty.attr('data-choices', field.choices);
                    optionProperty.html(field.label);
                    selectProperty.append(optionProperty);
                }
                // Checkbox for select property
                checkboxProperty = $("<INPUT>");
                checkboxProperty.addClass("checkbox-property");
                checkboxProperty.attr("type", "checkbox");
                // Add and-or div
                divAndOr = $("<DIV>");
                divAndOr.addClass("and-or-option");
                divAndOr.css({
                    'display': 'inline'
                });
                selectAndOr = $("<SELECT>");
                selectAndOr.addClass("select-and-or-rel");
                selectAndOr.attr('data-label', label);
                selectAndOr.attr('data-parentid', idFields);
                selectAndOr.append("<option class='option-and-or' value='not' selected='selected' disabled>" + gettext("choose one") + "</option>");
                selectAndOr.append("<option class='option-and-or' value='and'>" + gettext("And") + "</option>");
                selectAndOr.append("<option class='option-and-or' value='or'>" + gettext("Or") + "</option>");
                divAndOr.append(selectAndOr);

                // Link to remove the lookup
                removeField = $("<A>");
                removeField.addClass("remove-field-row-rel");
                removeField.attr('data-fieldid', fieldId);
                removeField.attr('data-parentid', idFields);
                // Icon
                removeFieldIcon = $("<I>");
                removeFieldIcon.addClass("fa fa-minus-circle");
                removeFieldIcon.attr('id', 'remove-field-icon-rel');
                removeField.append(removeFieldIcon);

                // Select for the aggregates elements
                selectAggregate = $("<SELECT>");
                selectAggregate.addClass("select-aggregate");
                selectAggregate.append("<option class='option-aggregate' value='' selected='selected' disabled>" + gettext("choose one") + "</option>");
                for(var i = 0; i < diagram.aggregates.length; i++) {
                    // We append the aggregate and the aggregate Distinct
                    var aggregate = diagram.aggregates[i];
                    var aggregateDistinct = aggregate + " distinct";
                    selectAggregate.append("<option class='option-aggregate' value='" + aggregate + "' data-distinct='false'>" + gettext(aggregate) + "</option>");
                    selectAggregate.append("<option class='option-aggregate' value='" + aggregate + "' data-distinct='true'>" + gettext(aggregateDistinct) + "</option>");
                }
            }

                // We append the patterns
                divField.append(checkboxProperty);
                divField.append(selectAggregate);
                divField.append(selectProperty);
                divField.append(selectLookup);
                divField.append(divAndOr);
                divField.append(removeField);

            return divField;
        };

        /**
         * Choose the options according to the datatype
         * - datatype
         */
        diagram.lookupOptions = function(datatype) {
            return diagram.lookupsValuesType[datatype];
        };

        /**
         * Calculate the anchor for an endpoint pattern.
         * The height used for the relations divs are
         * 24 px each. The accuracy of the calculations
         * have been obtained by testing the results.
         * - parentId
         * - relsId
         * - relNumber
         */
        diagram.calculateAnchor = function(parentId, relsId, relIndex) {
            var selectRelHeight = 17;
            var proportion = (($('#' + parentId).height() + selectRelHeight) - $('#' + relsId).height()) / $('#' + parentId).height();
            // We add 17 because the select rel height
            var offset = relIndex * 10 + 20;

            if(relIndex > 1) {
                offset = (relIndex * 10) + ((relIndex - 1) * 13) + 20;
            }
            var result = (offset/$('#' + parentId).height()) + proportion;

            return result;
        };

        /**
         * Recalculate the anchor for sources endpoints
         * - idBox
         * - idAllRels
         */
        diagram.recalculateAnchor = function(idBox, idAllRels) {
            if(jsPlumb.getEndpoints(idBox).length > 1) {
                for(var i = 1; i < jsPlumb.getEndpoints(idBox).length; i++) {
                    var endpoint = jsPlumb.getEndpoints(idBox)[i];
                    var anchor = diagram.calculateAnchor(idBox, idAllRels, endpoint.relIndex);
                    endpoint.anchor.y = anchor;
                }
            }
        };

        /**
         * Function that checks the number of boxes of a type to
         * show the selects for the alias. If we have more than 1 box,
         * we show them.
         * - typeName
         * - elemType
         */
        diagram.showSelects = function(typeName, elemType) {
            var numberOfBoxes = 0;

            // We check if the elemType is a node or a  relationship
            var boxesSelector = '.select-nodetype-' + typeName;
            var elems = $('#diagram').children();
            if(elemType == "relationship") {
                boxesSelector = '.select-reltype-' + typeName;
                elems = $('#diagramContainer').children();
            }

            // We check the number of boxes of that type that we already have
            $.each(elems, function(index, elem) {
                var elemId = $(elem).attr('id');
                if(elemId != undefined) {
                    var filter = new RegExp(".-" + typeName);
                    if(elemId.match(filter)) {
                        numberOfBoxes++;
                    }
                }
            });

            // If we have more than one box of that type at least, we show the selects and the "as" text
            if(numberOfBoxes > 1) {
                // We get the id of the type boxes
                var boxes = $(boxesSelector).parent().parent();
                // And we show the selects and the "as" text of each
                $.each(boxes, function(index, elem) {
                    idBox = $(elem).attr('id');
                    $('#' + idBox + ' ' + boxesSelector).css({
                        "display": "inline"
                    });
                    $('#' + idBox +  ' .show-as').css({
                        "display": "inline"
                    });
                    $('#' + idBox +  ' #inlineEditSelect_' + typeName).css({
                        "display": "inline"
                    });
                });
            }
        };

        /**
         * Function that checks the number of boxes of a type to
         * hide the selects for the alias. If we have 1 box, then we hide
         * them.
         * - typeName
         * - elemType
         */
        diagram.hideSelects = function(typeName, elemType) {
            var numberOfBoxes = 0;

            // We check if the elemType is a node or a  relationship
            var boxesSelector = '.select-nodetype-' + typeName;
            var elems = $('#diagram').children();
            if(elemType == "relationship") {
                boxesSelector = '.select-reltype-' + typeName;
                elems = $('#diagramContainer').children();
            }

            // We check the number of boxes of that type that we already have
            $.each(elems, function(index, elem) {
                var elemId = $(elem).attr('id');
                if(elemId != undefined) {
                    var filter = new RegExp(".-" + typeName);
                    if(elemId.match(filter)) {
                        numberOfBoxes++;
                    }
                }
            });

            // If we have one box of that nodetype at least, we hide the selects and the "as" text
            if(numberOfBoxes == 1) {
                // We get the id of the nodetype boxes
                var boxes = $(boxesSelector).parent().parent();
                // And we hide the selects and the "as" text of each
                $.each(boxes, function(index, box) {
                    idBox = $(box).attr('id');
                    $('#' + idBox + ' ' + boxesSelector).css({
                        "display": "none"
                    });
                    $('#' + idBox +  ' .show-as').css({
                        "display": "none"
                    });
                    $('#' + idBox +  ' #inlineEditSelect_' + typeName).css({
                        "display": "none"
                    });
                    // We restore the name for the type
                    var name = $(boxesSelector).val().split(' ')[0];
                    $('#' + idBox + ' .box-name').html(name);
                });
            } else if(numberOfBoxes == 0) {
                // We reset the counter
                if(elemType == "node") {
                    diagram.nodetypesCounter[typeName] = 0;
                } else {
                    diagram.reltypesCounter[typeName] = 0;
                }
            }
        };

        /**
         * Function that removes in the selects of the boxes, the alias
         * of a deleted box
         * - typeName
         * - boxAlias
         * - elemType
         */
        diagram.removeAlias = function(typeName, boxAlias, elemType) {
            var boxes = $('.select-nodetype-' + typeName);

            if(elemType == "relationship") {
                boxes = $('.select-reltype-' + typeName);
            }

            // We iterate over the boxes
            $.each(boxes, function(index, box) {
                // We iterate over the options of every box
                $(box).children().each(function(index) {
                    var $this = $(this);
                    if($this.val() == boxAlias) {
                        $this.remove();
                    }
                })
            })
        };

        /**
         * Function to create the logic when a field row is deleted
         * - parentId
         * - fieldId
         * - selectAndOr
         */
        diagram.removeFields = function(parentId, fieldId, selectorAndOr) {
            // We check that the field box need to have one
            // field row at least
            if($('#' + parentId).children().length > 1) {
                $("#" + fieldId).remove();
            } else {
                // We restore the default display for a field
                var fieldSelector = "#" + fieldId;
                $(fieldSelector + ' .select-property option[value="undefined"]').attr('selected', 'selected');
                $(fieldSelector + ' .select-lookup option[value="undefined"]').attr('selected', 'selected');
                $(fieldSelector + ' .select-lookup').css({
                    'display': 'none'
                });
                $(fieldSelector + ' .lookup-value').val('');
                $(fieldSelector + ' .lookup-value').css({
                    'display': 'none'
                });
                $(fieldSelector + ' ' + selectorAndOr + ' option[value="not"]').attr('selected', 'selected');
                $(fieldSelector + ' ' + selectorAndOr).css({
                    'display': 'none'
                });
            }

            // We select the 'Choose one' value for the last field
            var newFieldId = $($('#' + parentId).children().last()).attr('id');
            $('#' + newFieldId + ' .option-and-or:disabled').attr('disabled', false);
            $('#' + newFieldId + ' ' + selectorAndOr).val(gettext('choose one'));
            $('#' + newFieldId + ' ' + + selectorAndOr).children().first().prop('disabled', 'disabled');
        };

        /**
         * Returns the options of a relationship
         * - type
         * - label
         * - idRel
         * - anchor
         */
        diagram.getRelationshipOptions = function(type, name, label, idRel, anchor) {
            var relationshipOptions = null;

            if(type == 'source') {
                relationshipOptions = { endpoint: ["Image", {
                    src: diagram.relationshipImageSrc,
                    cssClass:"endpoint-image"}],
                                anchor: [1, anchor, 1, 0],
                                isSource: true,
                                connectorStyle: {
                                    strokeStyle: '#AEAA78',
                                    lineWidth: 2
                                },
                                connectorOverlays:[
                                    [ "PlainArrow", {
                                        foldback: 0,
                                        width:10,
                                        length:10,
                                        location:1,
                                        id:"arrow"}],
                                    [ "Label", {
                                        label:name,
                                        id:"label"}],
                                    ["Custom", {
                                        create:function(component) {
                                                            return diagram.addRelationBox(name, label, idRel);
                                                        },
                                        location:0.5,
                                        id:"diagramBoxRel-" + diagram.CounterRels + "-" + name
                                    }]
                                ],
                                paintStyle: {
                                    strokeStyle: '#AEAA78'
                                },
                                backgroundPaintStyle: {
                                    strokeStyle: '#AEAA78',
                                    lineWidth: 3
                                }
                              };
            } else if(type == 'target') {
                relationshipOptions = {
                    endpoint: [
                    "Rectangle",
                        {
                            width: 360,
                            height: 23,
                            cssClass: 'query-box-endpoint-target'
                        }
                    ],
                    // //anchors: [
                    // //    [0.5, 0, 0, 0],
                    // //    ["Continuous",
                    // //    {faces:[ "top", "left", "right" ]}]
                    // //],
                    // // anchor: [0.5, 0, 0, 0],
                    anchor: "TopCenter",
                    // endpoint: "Dot",
                    // anchor: [ "Perimeter", {shape: "Square", anchorCount:150}],
                    isTarget: true,
                    maxConnections: 99,
                    connectorStyle: {
                        strokeStyle: '#AEAA78',
                        lineWidth: 2},
                    connectorOverlays:[
                        [ "PlainArrow", {
                            foldback: 0,
                            width:10,
                            length:10,
                            location:0,
                            id:"arrow"}]
                    ],
                    paintStyle: {
                        strokeStyle: '#348E82'
                    },
                    backgroundPaintStyle: {
                        strokeStyle: '#348E82',
                        lineWidth: 3
                    }
                };
            }
            return relationshipOptions;
        };

        /**
         * Function triggered when a new relationship is loaded and checks
         * if we have loaded some box with the target equal to targetType.
         * If not, we load a box with that target and create a relationship
         * between the boxes.
         */
        diagram.checkTargetType = function(targetType, relation) {
            var elems = $('#diagram').children();
            var numberOfBoxes = 0;
            var uuidSource = relation + "-source";
            var uuidTarget = "";
            // We check the number of boxes of that type that we already have
            $.each(elems, function(index, elem) {
                var elemId = $(elem).attr('id');
                if(elemId != undefined) {
                    var filter = new RegExp(".-" + targetType);
                    if(elemId.match(filter)) {
                        numberOfBoxes++;
                    }
                }
            });

            // If we have 1 at least, we do nothing. In another case we load a
            // box of that type and create a relationship.
            if(numberOfBoxes == 0) {
                // We want the "a" elements
                var typesLinks = $('#node-options').children().children();
                $.each(typesLinks, function(index, link) {
                    var dataType = $(link).data("type");
                    if(dataType == targetType) {
                        $(link).click();
                    }
                });

                // We update the elems variable to include the new box added
                elems = $('#diagram').children();
                // We get the id of the new box and we create the connection
                $.each(elems, function(index, elem) {
                    var elemId = $(elem).attr('id');
                    if(elemId != undefined) {
                        var filter = new RegExp(".-" + targetType);
                        if(elemId.match(filter)) {
                            uuidTarget = elemId + "-target";
                        }
                    }
                });

                // We create the connection
                jsPlumb.connect({uuids:[uuidSource, uuidTarget]});

                jsPlumb.repaintEverything();
            }
        };
    };

    /**
     * Generate the query to send to the backend
     */
    diagram.generateQuery = function() {
        var query = {};
        var propertiesChecked = {};

        // Conditions
        var conditionsArray = new Array();
        var properties = $('.select-property');
        $.each(properties, function(index, property) {
            var conditionArray = new Array();
            var lookup = $(property).next().val();
            var propertyTag = "property";
            // We really should think about another solution to get the parent element
            var parent = $(property).parent().parent().parent().parent().parent();
            var parentId = $(parent).attr('id');
            var alias = $('#' + parentId + ' .title').children().filter('input, select').val();
            var propertyName = $(property).val();
            var propertyValue = $(property).next().next().val();

            // Treatment for the lookup 'has some value & has no value'
            if(lookup === 'isnull') {
                propertyValue = true;
            } else if(lookup === 'isnotnull') {
                lookup = 'isnull';
                propertyValue = false;
            }

            // Treatment for the lookup 'is between'
            if(lookup === 'between') {
                propertyValue1 = propertyValue;
                propertyValue2 = $(property).next().next().next().val();
                propertyValue = new Array(propertyValue1, propertyValue2);
            }

            // We store the datatype
            var fieldId = $(property).parent().attr('id');
            var datatype = $('#' + fieldId + ' .select-property option:selected').data('datatype');

            // If exists, we store the aggregate and the value for distinct
            var aggregate = $(property).prev().find(":selected");
            var aggregateValue = $(aggregate).val();
            var aggregateDistinct = '';
            // We check if the aggregate value is not the "choose one" option
            if(aggregateValue != '') {
                aggregateDistinct = $(aggregate).data("distinct");
            } else {
                aggregateValue = false;
            }

            // We store the checked properties
            if(!propertiesChecked[alias])
                propertiesChecked[alias] = new Array();
            if($(property).prev().prev().attr('checked')) {
                var propertiesDict = {};
                propertiesDict["property"] = $(property).val();
                propertiesDict["aggregate"] = aggregateValue;
                propertiesDict["distinct"] = aggregateDistinct;
                propertiesDict["datatype"] = datatype;
                propertiesChecked[alias].push(propertiesDict);
            }

            // We check if we have and/or option
            var andOrId = $(property).parent().attr('id');
            var andOrVal = $('#' + andOrId + ' .and-or-option select').val();

            if((lookup != "undefined") && (lookup != null)) {
                var propertyArray = new Array();
                propertyArray.push(propertyTag);
                propertyArray.push(alias);
                propertyArray.push(propertyName);

                conditionArray.push(lookup);
                conditionArray.push(propertyArray);
                conditionArray.push(propertyValue);

                if(andOrVal) {
                    conditionArray.push(andOrVal);
                } else {
                    conditionArray.push("not");
                }

                if(datatype) {
                    conditionArray.push(datatype);
                } else {
                    conditionArray.push("undefined");
                }

                conditionsArray.push(conditionArray);
            }
        });

        query["conditions"] = conditionsArray;

        // Origin
        var originsArray = new Array();
        var elements = $('input, option').filter(function(){ return $(this).attr("class") && $(this).attr("class").match(/(option-reltype|option-nodetype)./) && $(this).attr("selected");});
        $.each(elements, function(index, element) {
            var origin = {};
            var type = "relationship";
            // We check the type of the origin
            if($(element).attr("class").indexOf("nodetype") >= 0)
                type = "node";
            var alias = $(element).val();
            var type_id = $(element).data('modelid');
            origin.alias = alias;
            origin.type = type;
            origin.type_id = type_id;
            originsArray.push(origin);
        });

        query["origins"] = originsArray;

        // Patterns
        var patternsArray = new Array();
        // This is the way to get the connections in early versions
        // var elements = jsPlumb.getAllConnections().jsPlumb_DefaultScope;
        // This is the way to get the connections in the actual version
        var elements = jsPlumb.getAllConnections();
        $.each(elements, function(index, element) {
            var pattern = {};
            var relation = {};
            var source = {};
            var target = {};
            // We get the id for the relation div
            var relationId = element.idrel;

            // We get the source and the target of the relation
            var sourceId = element.sourceId;
            var targetId = element.targetId;

            // We get the selectors for every component to build
            // the json correctly
            var relationSelector = $('#' + relationId + ' .title');
            if(relationSelector.length == 0) {
                alert("There's been an error in the relationship " + sourceId + "-" + targetId + ". Please remove it and try again");
            }
            //var relationAlias = $('#' + relationId + ' .title select').val();
            var relationAlias = $('#' + relationId + ' .title').children().filter('input, select').val();
            var relationModelId = relationSelector.data('modelid');
            relation.alias = relationAlias;
            relation.type = 'relationship';
            relation.type_id = relationModelId;

            var sourceSelector = $('#' + sourceId + ' .title');
            //var sourceAlias = $('#' + sourceId + ' .title select').val();
            var sourceAlias = $('#' + sourceId + ' .title').children().filter('input, select').val();
            var sourceModelId = sourceSelector.data('modelid');
            source.alias = sourceAlias;
            source.type = 'node';
            source.type_id = sourceModelId;

            var targetSelector = $('#' + targetId + ' .title');
            //var targetAlias = $('#' + targetId + ' .title select').val();
            var targetAlias = $('#' + targetId + ' .title').children().filter('input, select').val();
            var targetModelId = targetSelector.data('modelid');
            target.alias = targetAlias;
            target.type = 'node';
            target.type_id = targetModelId;

            pattern.relation = relation;
            pattern.source = source;
            pattern.target = target;

            patternsArray.push(pattern);
        });

        query["patterns"] = patternsArray;

        // Result
        var resultsArray = new Array();
        var elements = $('input, option').filter(function(){ return $(this).attr("class") && $(this).attr("class").match(/(option-reltype|option-nodetype)./) && $(this).attr("selected");});
        $.each(elements, function(index, element) {
            var result = {};
            var alias = $(element).val();
            var properties = propertiesChecked[element.value];

            if(!properties)
                properties = new Array();

            result.alias = alias;
            result.properties = properties;

            resultsArray.push(result);
        });

        query["results"] = resultsArray;

        return query;
    };

    /**
     * Load the query
     */
    diagram.loadQuery = function(jsonQuery) {
        try {
            jsonDict = JSON.parse(jsonQuery);
            types = jsonDict["aliases"]["types"];
            nodetypes = {};
            origins = jsonDict["query"]["origins"];
            originsLength = origins.length;
            conditions = jsonDict["query"]["conditions"];
            conditionsLength = conditions.length;
            conditionsDict = {};
            patterns = jsonDict["query"]["patterns"];
            patternsLength = patterns.length;
            checkboxes = jsonDict["checkboxes"];
            aggregates = jsonDict["aggregates"];
            var fieldIndex = 0;
            var conditionsIndex = 0;

            // We save the node types to load the boxes
            for(var i = 0; i < originsLength; i++) {
                if(origins[i].type == "node") {
                    nodeAlias = origins[i].alias;
                    nodetypes[nodeAlias] = types[nodeAlias];
                }
            }
            // We store the conditions in a dictionary
            var conditionsAlias = [];
            for(var i = 0; i < conditionsLength; i++) {
                var conditionsArray = [];
                // alias
                alias = conditions[i][1][1];
                // lookup
                lookup = jsonDict["query"]["conditions"][i][0];
                conditionsArray.push(lookup);
                // property
                property = jsonDict["query"]["conditions"][i][1][2];
                conditionsArray.push(property);
                // value
                value = jsonDict["query"]["conditions"][i][2];
                conditionsArray.push(value);
                // We have to check the and-or value
                andOr = jsonDict["query"]["conditions"][i][3];
                conditionsArray.push(andOr);

                //conditionsAlias.push(conditionsArray);
                if(!conditionsDict[alias])
                    conditionsDict[alias] = [];
                conditionsDict[alias].push(conditionsArray);
            }

            // Load the boxes for nodetypes
            for(key in nodetypes) {
                if(nodetypes.hasOwnProperty(key)) {
                    id = nodetypes[key].id;
                    // We change the counter to get the correct id of the box
                    counter = parseInt(id.split("-")[1]);
                    diagram.Counter = counter - 1;
                    typename = nodetypes[key].typename;
                    leftPos = nodetypes[key].left;
                    topPos = nodetypes[key].top;
                    // Load the box and set the positions
                    diagram.loadBox(typename);
                    $('#' + id).css({
                        "left": leftPos,
                        "top": topPos
                    });
                    fields = jsonDict["fields"][key];
                    // Load the conditions for the box
                    // This loop could be replace if we have a
                    // dict instead an array
                    // ---------------------------------------
                    // Every index in the loop is an index for a field
                    var boxFields = 0;
                    fieldIndex++;
                    for(var i = 0; i < fields.length; i++) {
                        boxFields++;
                        // If we have more than one field, we add
                        // a new field
                        if(boxFields > 1) {
                            $('#' + id + ' .select-and-or').change();
                            fieldIndex++;
                        }
                        // We check if we have conditions
                        if(jsonDict["fieldsConditions"][fieldIndex - 1]) {
                            conditions = conditionsDict[key][conditionsIndex];
                            // lookup
                            lookup = conditions[0];
                            // property
                            property = conditions[1];
                            // value
                            // we check if the lookup is 'is between'
                            if(lookup == "between") {
                                value1 = conditions[2][0];
                                value2 = conditions[2][1];
                            } else {
                                value = conditions[2];
                            }
                            // We have to check the and-or value
                            andOr = conditions[3];
                            // We set the values in the correct position
                            //$field = $('#' + id + " #field" + (i+1));
                            $('#' + id + " #field" + fieldIndex + " .select-property").val(property);
                            $('#' + id + " #field" + fieldIndex + " .select-property").change();
                            $('#' + id + " #field" + fieldIndex + " .select-lookup").val(lookup);
                            $('#' + id + " #field" + fieldIndex + " .select-lookup").change();
                            // If the lookup is "is between", we have two inputs
                            if(lookup == "between") {
                                $($('#' + id + " #field" + fieldIndex + " .lookup-value")[0]).val(value);
                                $($('#' + id + " #field" + fieldIndex + " .lookup-value")[1]).val(value);
                            } else {
                                $('#' + id + " #field" + fieldIndex + " .lookup-value").val(value);
                            }
                            if(andOr != "not") {
                                $('#' + id + " #field" + fieldIndex + " .select-and-or").val(andOr);
                            }
                            conditionsIndex++;
                        } else {
                            // If we dont have conditions, we let the user to change the lookups or the 'and-or' select
                            $('#' + id + " #field" + fieldIndex + " .select-property").change();
                        }
                    }
                    conditionsIndex = 0;
                    // We select the correct value for the alias
                    $('#' + id + ' .title select').val(key);
                }
                // We check if we have to show the 'alias selects' for this type
                diagram.showSelects(typename, "node");
            }
            // We check the checkboxes to return
            for(key in checkboxes) {
                if(checkboxes.hasOwnProperty(key)) {
                    var property = checkboxes[key];
                    var fieldIndex = parseInt(key) + 1;
                    $("#field" + fieldIndex + " .select-property").val(property);
                    $("#field" + fieldIndex + ' .checkbox-property').click();
                }
            }
            // We check all the necessary logic for the aggregates
            for(key in aggregates) {
                if(aggregates.hasOwnProperty(key)) {
                    // We get the neccesary info to activate the advanced mode of the box
                    var selector = $("#field" + fieldIndex + " .select-aggregate");
                    var idBox = selector.parent().parent().parent().parent().parent().attr('id')
                    var typename = idBox.split('-')[2];
                    $('#' + idBox + ' #inlineAdvancedMode_' + typename).click();
                    // We set the aggregate value
                    var aggregate = aggregates[key];
                    selector.val(aggregate);
                }
            }
            // Load the relationships between the boxes
            for(var i = 0; i < patternsLength; i++) {
                var source = jsonDict["query"]["patterns"][i].source.alias;
                var sourceId = types[source].id;

                var target = jsonDict["query"]["patterns"][i].target.alias;
                var targetId = types[target].id;

                var relation = jsonDict["query"]["patterns"][i].relation.alias;
                var relationValue = types[relation].typename;
                var relationName = relationValue;

                // We check if the relationship is of type wildcard
                if(relationValue == "WildcardRel")
                   relationName = "wildcard";

                var uuidSource = sourceId + '-' + relationName + '-source';
                var uuidTarget = targetId + '-target';

                $('#' + sourceId + ' .select-rel').val(relationValue);
                $('#' + sourceId + ' .select-rel').change();
                $('#' + sourceId + ' .select-rel').change();

                jsPlumb.connect({
                    uuids: [uuidSource, uuidTarget],
                    anchor: ["Perimeter", {shape: "Rectangle"}]
                });

                // We check if we need to show the 'alias selects' for the relationship boxes
                diagram.showSelects(relationValue, "relationship");
            }

            jsPlumb.repaintEverything();
        } catch(error) {
            alert(error);
        }
    };

    /**
     * Save the query
     */
    diagram.saveQuery = function() {
        var saveElements = {};
        var query = diagram.generateQuery();
        saveElements["query"] = query;
        var elements = $('.title select');
        var checkboxes = $('.checkbox-property');
        var aggregates = $('.select-aggregate');
        var fieldsDict = {};
        var aliasDict = {};
        var typesDict = {};
        var checkboxesDict = {};
        var aggregatesDict = {};
        var fieldsConditionsDict = {};
        // We get the id, typename, left and top of the boxes
        $.each(elements, function(index, element) {
            var valuesDict = {};
            var parent = $(element).parent().parent();

            var alias = $(element).val();
            var id = $(parent).attr('id');
            var typename = $(element).attr('class').substring(15);
            // This is for check if we have a relationship or a node
            if(typename.substring(0,1) == "-")
                typename = typename.substring(1);
            var left = $(parent).css('left');
            var top = $(parent).css('top');

            valuesDict['id'] = id;
            valuesDict['typename'] = typename;
            valuesDict['left'] = left;
            valuesDict['top'] = top;

            typesDict[alias] = valuesDict;
        });
        aliasDict["types"] = typesDict;
        // We get the checkboxes checked and the property to return
        $.each(checkboxes, function(index, checkbox) {
            if($(checkbox).prop('checked')) {
                checkboxesDict[index] = $(checkbox).next().next().val();
            }
        });
        // We get the aggregates if they exist
        $.each(aggregates, function(index, aggregate) {
            var aggregateValue = $(aggregate).val();
            if(aggregateValue) {
                aggregatesDict[index] = aggregateValue;
            }
        });
        // We get the fields that are conditions to construct the box properly
        $.each(checkboxes, function(index, checkbox) {
            var lookup = $(checkbox).next().next().next().val();
            var inputLookup = $(checkbox).next().next().next().next().val();
            if(lookup && inputLookup) {
                fieldsConditionsDict[index] = true;
            } else {
                fieldsConditionsDict[index] = false;
            }
        });
        saveElements['aliases'] = aliasDict;
        // We store all the important values
        fieldsDict['fields'] = diagram.fieldsForNodes;
        fieldsDict['checkboxes'] = checkboxesDict;
        fieldsDict['aggregates'] = aggregatesDict;
        fieldsDict['fieldsConditions'] = fieldsConditionsDict;
        fieldsDict['fieldRelsCounter'] = diagram.fieldRelsCounter;
        saveElements['fields'] = fieldsDict;
        // What we do with nodetypesCounter and reltypesCounter?
        return saveElements;
    };

    /**
     * Interactions functions
     */

    /**
     * Add box type to the diagram
     */
    $('.add-box').on('click', function() {
        var $this = $(this);
        var nodeType = $this.data("type");
        var modelName = diagram.loadBox(nodeType);

        // We check if we have more than one box to show the selects for the alias
        diagram.showSelects(nodeType, "node");

        // The next lines is to select the new alias in the box
        var elem = $('.select-nodetype-' + nodeType + ' #' + modelName + (diagram.nodetypesCounter[nodeType])).length - 1;
        $($('.select-nodetype-' + nodeType + ' #' + modelName + (diagram.nodetypesCounter[nodeType]))[elem]).attr('selected', 'selected');
    });

    /**
     * Add field row inside a box type
     */
    $("#diagramContainer").on('click', '.add-field-row', function() {
        var $this = $(this);
        var parentId = $this.data("parentid");
        var modelName = $this.data("model");
        var graphName = $this.data("graph");
        var typeName = $this.data("typename");
        var boxalias = $this.data("boxalias");
        var idBox = $this.data("idbox");
        var idAllRels = $this.data("idallrels");

        divField = diagram.addFieldRow(graphName, modelName, parentId, typeName, boxalias, idBox, idAllRels);

        $("#" + parentId).append(divField);

        // Recalculate anchor for source endpoints
        diagram.recalculateAnchor(idBox, idAllRels);

        jsPlumb.repaintEverything();
    });

    /**
     * Add field row inside a box type
     */
    $("#diagramContainer").on('change', '.select-and-or', function() {
        var $this = $(this);
        // We check if the field is the last to field to allow the addition
        // of a new field
        var field = $this.parent().parent();
        if($(field).next().length == 0) {
            var parentId = $this.data("parentid");
            var modelName = $this.data("model");
            var graphName = $this.data("graph");
            var typeName = $this.data("typename");
            var boxalias = $this.data("boxalias");
            var idBox = $this.data("idbox");
            var idAllRels = $this.data("idallrels");

            divField = diagram.addFieldRow(graphName, modelName, parentId, typeName, boxalias, idBox, idAllRels);

            $("#" + parentId).append(divField);

            // Recalculate anchor for source endpoints
            diagram.recalculateAnchor(idBox, idAllRels);

            jsPlumb.repaintEverything();
        }
    });

    /**
     * Add field row inside a rel type
     */
    $("#diagramContainer").on('change', '.select-and-or-rel', function() {
        var $this = $(this);
        var label = $this.data("label");
        var parentId = $this.data("parentid");

        // We check if the field is the last to field to allow the addition
        // of a new field
        var field = $this.parent().parent();
        if($(field).next().length == 0) {
            divField = diagram.addFieldRelRow(label, parentId);

            $("#" + parentId).append(divField);
        }
    });

    /**
     * Remove field row inside a box type
     */
    $("#diagramContainer").on('click', '.remove-field-row', function() {
        var $this = $(this);
        var fieldId = $this.data("fieldid");
        var parentId = $this.data("parentid");
        var idBox = $this.data("idbox");
        var idAllRels = $this.data("idallrels");

        // We store the selector for the and/or select for nodes
        var selectorAndOr = '.select-and-or';
        // We call to the function to remove the field
        diagram.removeFields(parentId, fieldId, selectorAndOr);

        // Recalculate anchor for source endpoints
        diagram.recalculateAnchor(idBox, idAllRels);

        jsPlumb.repaintEverything();
    });

    /**
     * Remove field row inside a box type
     */
    $("#diagramContainer").on('click', '.remove-field-row-rel', function() {
        var $this = $(this);
        var fieldId = $this.data("fieldid");
        var parentId = $this.data("parentid");

        // We store the selector for the and/or select for rels
        var selectorAndOr = '.select-and-or-rel';
        // We call to the function to remove the field
        diagram.removeFields(parentId, fieldId, selectorAndOr);
    });

    /**
     * Add a new relationship row for that box type
     */
    $("#diagramContainer").on('change', '.select-rel', function() {
        var $this = $(this);
        // We gonna select the select field
        var parent = $this.parent();
        var parentId = parent.attr("id");
        var selectField = $('#' + parentId + " .select-rel");

        var idBox = $('option:selected', selectField).data("parentid");
        var boxrel = $('option:selected', selectField).data("boxrel");
        var idAllRels = $('option:selected', selectField).data("relsid");
        var relationId = $('option:selected', selectField).data("relationid");
        var label = $('option:selected', selectField).data("label");
        var name = $('option:selected', selectField).data("name");
        var idrel = $('option:selected', selectField).data("idrel");
        var source = $('option:selected', selectField).data("source");
        var scopeSource = $('option:selected', selectField).data("scope");

        // If exists a relationship with that id, we dont add the
        // relationship

        if($('#div-' + relationId).length == 0) {

            // We check if we have the type in the reltypesList. If not,
            // we create it.
            if(!diagram.reltypesList[name]) {
                diagram.reltypesList[name] = new Array();
            }

            divAllRel = $("<DIV>");
            divAllRel.addClass("div-list-rel");
            divAllRel.attr("id", "div-" + relationId);

            listRelElement = $("<LI>");
            listRelElement.addClass("list-rel");

            diagram.setLabel(listRelElement, label);
            //listRelElement.html(label);

            if(source) {
                var relIndex = diagram.relindex[idBox];
                // calculate anchor
                // We need idBox and idAllRels
                var anchor = diagram.calculateAnchor(idBox, idAllRels, relIndex);
                if(source) {
                    var uuidSource = relationId + "-source";
                    if(!jsPlumb.getEndpoint(uuidSource)) {
                        var endpointSource = jsPlumb.addEndpoint(idBox, { uuid:uuidSource, connector: "Flowchart"}, diagram.getRelationshipOptions('source', name, label, idrel, anchor));
                        endpointSource.relIndex = relIndex;
                        endpointSource.scopeSource = scopeSource;
                    }
                }
                diagram.relindex[idBox]++;
            }

            // Link to remove the relations
            removeRelation = $("<A>");
            removeRelation.addClass("remove-relation");
            removeRelation.attr('data-parentid', relationId);
            removeRelation.attr('data-idbox', idBox);
            removeRelation.attr('data-relsid', idAllRels);
            removeRelation.attr('data-divrelid', "div-" + relationId);
            removeRelation.attr('data-name', name);

            // Remove relation icon
            removeRelationIcon = $("<I>");
            removeRelationIcon.addClass("fa fa-minus-circle");
            removeRelationIcon.attr('id', 'remove-relation-icon');
            removeRelation.append(removeRelationIcon);

            // Help text for drag relationship
            var helpText = $("<SPAN>");
            helpText.addClass("help-text");
            helpText.css({
                "font-style": "italic"
            });

            divAllRel.append(listRelElement);
            divAllRel.append(removeRelation);

            $('#' + boxrel).append(divAllRel);
        }
        // Recalculate anchor for source endpoints
        diagram.recalculateAnchor(idBox, idAllRels);

        $('.endpoint-image').attr("title", "drag me!")

        jsPlumb.repaintEverything();

        // We check if the target type is already loaded
        // If it doesn't, we load the type and create the connection
        // between the two types
        diagram.checkTargetType(scopeSource, relationId);
    });

    /**
     * Add the values of the select lookup in relation with the property
     * selected
     */
    $("#diagramContainer").on('change', '.select-property', function() {
        var $this = $(this);
        var fieldId = $this.data("fieldid");
        var selector = "#" + fieldId + " .select-lookup";
        var datatype = $('option:selected', this).data("datatype");
        var choices = $('option:selected', this).data("choices");
        var arrayOptions = diagram.lookupOptions(datatype);

        // We show the select lookup
        $(selector).css({
            "display": "inline"
        });

        // We show the and-or select for nodes
        $('#' + fieldId + ' .select-and-or').css({
            "display": "inline"
        });

        // We show the and-or select for relationships
        $('#' + fieldId + ' .select-and-or-rel').css({
            "display": "inline"
        });

        // If already we have lookups, we remove them to avoid overwritting
        if($(selector).children()) {
            $(selector).children().remove();
        }

        // This if is for check if the select-property is for a wildcard input
        if(!arrayOptions) {
            datatype = 'default';
            arrayOptions = diagram.lookupOptions(datatype);
        }

        for (var i = 0; i < arrayOptions.length; i++) {
            var value = diagram.lookupsBackendValues[arrayOptions[i]];
            $(selector).attr("data-fieldid", fieldId);
            if(i == 0) {
                $(selector).append('<option class="lookup-option" value="' + value + '" disabled="disabled" selected="selected">' + arrayOptions[i] + '</option>');
            } else {
                $(selector).append('<option class="lookup-option" value="' + value + '">' + arrayOptions[i] + '</option>');
            }
        }

        // Here we ask if the datatype needs a special input
        var tagName = $this.next().next().prop("tagName");
        if(datatype == 'boolean') {
            // Boolean select
            if(tagName == "INPUT" || tagName == "SELECT") {
                $this.next().next().remove();
                var tagName = $this.next().next().prop("tagName");
                if(tagName == "INPUT") {
                    $this.next().next().remove();
                }
            }
            var inputLookup = $("<SELECT>");
            inputLookup.addClass("lookup-value");
            inputLookup.css({
                "width": "60px",
                "margin-left": "8px",
                "margin-top": "-4px",
                "padding": "0",
                "display": "none"
            });
            inputLookup.append('<option class="lookup-value" value="true">True</option>');
            inputLookup.append('<option class="lookup-value" value="false">False</option>');
            $(inputLookup).insertAfter($('#' + fieldId + ' .select-lookup'))
        } else if(datatype == 'choices') {
            // Choices select
            var choicesArray = choices.split(',');
            if(tagName == "INPUT" || tagName == "SELECT") {
                $this.next().next().remove();
                var tagName = $this.next().next().prop("tagName");
                if(tagName == "INPUT") {
                    $this.next().next().remove();
                }
            }
            var inputLookup = $("<SELECT>");
            inputLookup.addClass("lookup-value");
            inputLookup.css({
                "width": "60px",
                "margin-left": "8px",
                "margin-top": "-4px",
                "padding": "0",
                "display": "none"
            });
            inputLookup.append('<option class="lookup-value" value=""></option>');
            for(var j = 3; j < choicesArray.length; j = j + 2) {
                inputLookup.append('<option class="lookup-value" value="' + choicesArray[j] +'">' + choicesArray[j] + '</option>');
            }
            $(inputLookup).insertAfter($('#' + fieldId + ' .select-lookup'))
        } else if(datatype == 'auto_now') {
            // Datepicker input
            if(tagName == "INPUT" || tagName == "SELECT") {
                $this.next().next().remove();
                var tagName = $this.next().next().prop("tagName");
                if(tagName == "INPUT") {
                    $this.next().next().remove();
                }
            }
            var inputLookup = $("<INPUT>");
            inputLookup.addClass("lookup-value");
            inputLookup.attr("type", "text");
            inputLookup.css({
                "width": "60px",
                "margin-left": "8px",
                "padding": "2px 2px 1px 2px",
                "margin-top": "-4px",
                "display": "none"
            });
            inputLookup.timepicker({
                timeOnly: true,
                showSecond: true,
            });
            $(inputLookup).insertAfter($('#' + fieldId + ' .select-lookup'))
        } else if(datatype == 'auto_now_add') {
            // Datepicker input
            if(tagName == "INPUT" || tagName == "SELECT") {
                $this.next().next().remove();
                var tagName = $this.next().next().prop("tagName");
                if(tagName == "INPUT") {
                    $this.next().next().remove();
                }
            }
            var inputLookup = $("<INPUT>");
            inputLookup.addClass("lookup-value time");
            inputLookup.attr("type", "text");
            inputLookup.css({
                "width": "60px",
                "margin-left": "8px",
                "padding": "2px 2px 1px 2px",
                "margin-top": "-4px",
                "display": "none"
            });
            inputLookup.timepicker({
                timeOnly: true,
                showSecond: true,
            });
            $(inputLookup).insertAfter($('#' + fieldId + ' .select-lookup'))
        } else if(datatype == 'date') {
            // Datepicker input
            if(tagName == "INPUT" || tagName == "SELECT") {
                $this.next().next().remove();
                var tagName = $this.next().next().prop("tagName");
                if(tagName == "INPUT") {
                    $this.next().next().remove();
                }
            }
            var inputLookup = $("<INPUT>");
            inputLookup.addClass("lookup-value time");
            inputLookup.attr("type", "text");
            inputLookup.css({
                "width": "60px",
                "margin-left": "8px",
                "padding": "2px 2px 1px 2px",
                "margin-top": "-4px",
                "display": "none"
            });
            var options = {
                appendText: "(yyyy-mm-dd)",
                gotoCurrent: true,
                dateFormat: 'yy-mm-dd',
                changeYear: true,
                yearRange: "-3000:3000"
            };
            inputLookup.datepicker(options);
            $(inputLookup).insertAfter($('#' + fieldId + ' .select-lookup'))
        } else if(datatype == 'time') {
            // Datepicker input
            if(tagName == "INPUT" || tagName == "SELECT") {
                $this.next().next().remove();
                var tagName = $this.next().next().prop("tagName");
                if(tagName == "INPUT") {
                    $this.next().next().remove();
                }
            }
            var inputLookup = $("<INPUT>");
            inputLookup.addClass("lookup-value time");
            inputLookup.attr("type", "text");
            inputLookup.css({
                "width": "60px",
                "margin-left": "8px",
                "padding": "2px 2px 1px 2px",
                "margin-top": "-4px",
                "display": "none"
            });
            inputLookup.timepicker({
                timeOnly: true,
                showSecond: true,
            });
            $(inputLookup).insertAfter($('#' + fieldId + ' .select-lookup'))
        } else if(datatype == 'auto_user') {
            // Users select
            if(tagName == "INPUT" || tagName == "SELECT") {
                $this.next().next().remove();
                var tagName = $this.next().next().prop("tagName");
                if(tagName == "INPUT") {
                    $this.next().next().remove();
                }
            }
            var inputLookup = $("<INPUT>");
            inputLookup.addClass("lookup-value autocomplete");
            inputLookup.attr("type", "text");
            inputLookup.css({
                "width": "60px",
                "margin-left": "8px",
                "padding": "2px 2px 1px 2px",
                "margin-top": "-4px",
                "display": "none"
            });
            $(inputLookup).insertAfter($('#' + fieldId + ' .select-lookup'))
        } else {
            // Initial input
            if(tagName == "INPUT" || tagName == "SELECT") {
                $this.next().next().remove();
                tagName = $this.next().next().prop("tagName");
                if(tagName == "INPUT") {
                    $this.next().next().remove();
                }
            }
            var inputLookup = $("<INPUT>");
            inputLookup.addClass("lookup-value");
            inputLookup.attr("type", "text");
            inputLookup.css({
                "width": "60px",
                "margin-left": "8px",
                "padding": "2px 2px 1px 2px",
                "margin-top": "-4px",
                "display": "none"
            });
            $(inputLookup).insertAfter($('#' + fieldId + ' .select-lookup'))
        }

        if(datatype == 'auto_user') {
            $(".autocomplete").autocomplete({
                source: function (request, response) {
                    $.ajax({
                        url: diagram.url_collaborators,
                        data: { term: request.term },
                        success: function (data) {
                            var elements = JSON.parse(data);
                            var transformed = $.each(elements, function(index, elem) {
                                return elem.value ;
                            });
                            response(transformed);
                        },
                        error: function () {
                            response([]);
                        }
                    });
                }
            });
        }
    });

    /**
     * Add a special input related to the lookup selected and the type
     * of the property
     */
    $("#diagramContainer").on('change', '.select-lookup', function() {
        var $this = $(this);
        var value = $this.val();
        // Here we get the datatype for the special inputs for booleans,
        // dates, etc.
        var tagName = $this.next().prop("tagName");
        var fieldId = $this.data("fieldid");

        // We show the input for the lookup value
        $('#' + fieldId + " .lookup-value").css({
            "display": "inline"
        });

        var datatype = $('#' + fieldId + ' .select-property option:selected').data("datatype");
        var condition = datatype != 'date'
                        && datatype != 'boolean'
                        && datatype != 'choices'
                        && datatype != 'auto_now'
                        && datatype != 'auto_now_add'
                        && datatype != 'auto_user';
        if(condition) {
            if(value == "between") {
                // two inputs - we check if we have introduced an input field
                var inputValueFirst = $this.next().val();
                var inputValueSecond = $this.next().next().val();
                if(tagName == "INPUT" || tagName == "SELECT") {
                    $this.next().remove();
                    tagName = $this.next().prop("tagName");
                    if(tagName == "INPUT") {
                        $this.next().remove();
                    }
                }
                $this.after("<input class='lookup-value' type='text' style=\"width: 25px; margin-left: 2%; padding: 2px 2px 1px 2px; margin-top: -4px; display: inline;\" />");
                $this.after("<input class='lookup-value' type='text' style=\"width: 25px; margin-left: 2%; padding: 2px 2px 1px 2px; margin-top: -4px; display: inline;\" />");
                // We keep the value of the inputs
                if(inputValueFirst) {
                    $this.next().val(inputValueFirst);
                } else if(inputValueSecond) {
                    $this.next().next().val(inputValueSecond);
                }
            } else if((value == "isnotnull") || (value == "isnull")) {
                // no inputs
                if(tagName == "INPUT" || tagName == "SELECT") {
                    $this.next().remove();
                    tagName = $this.next().prop("tagName");
                    if(tagName == "INPUT") {
                        $this.next().remove();
                    }
                }
            } else {
                // one input - we check if we have introduced an input field
                var inputValue = $this.next().val();
                if(tagName == "INPUT" || tagName == "SELECT") {
                    $this.next().remove();
                    tagName = $this.next().prop("tagName");
                    if(tagName == "INPUT") {
                        $this.next().remove();
                    }
                }
                $this.after("<input class='lookup-value' type='text' style='width: 60px; margin-left: 8px; padding: 2px 2px 1px 2px; margin-top: -4px; display: inline;' />");
                // We keep the value of the input
                if(inputValue) {
                    $this.next().val(inputValue);
                }
            }
        } else {
            // In this branch, the type would be boolean, choices, date or user
        }
    });

    /**
     * Add the handler to remove the wire
     */
    $("#diagramContainer").on('click', '.remove-relation', function() {
        var $this = $(this);
        var patternId = $this.data("parentid");
        var idBox = $this.data("idbox");
        var idAllRels = $this.data("relsid");
        var divRelId = $this.data("divrelid");
        var name = $this.data("name");

        diagram.relindex[idBox]--;

        // We check if we have the connection to get the idrel value
        var endpointSelector = patternId + '-source';
        var connections = jsPlumb.getEndpoint(endpointSelector).connections;
        var connectionsLength = connections.length;
        if(connectionsLength > 0) {
            // We get the id of the relationship box to remove it in the selects
            var idrel = connections[0].idrel;
            // We get the alias of the box to remove it in the selects
            var boxAlias = $('#' + idrel + ' .select-reltype-' + name).val();
        }

        var oldEndpointRelIndex = jsPlumb.getEndpoint(patternId + '-source').relIndex;
        jsPlumb.deleteEndpoint(patternId + '-source');
        $('#' + divRelId).remove();

        // Recalculate anchor if we have source endpoints already
        if(jsPlumb.getEndpoints(idBox).length > 1) {
            // We start at index 1 because the index 0 si the target
            var endpointsLength = jsPlumb.getEndpoints(idBox).length;
            for(var i = 1; i < endpointsLength; i++) {
                var endpoint = jsPlumb.getEndpoints(idBox)[i];
                var anchor = 0;
                // This is for the case that we have removed some
                // element and need to update the rel index.
                // The substract operation is because we have an endpoint
                // extra: The target endpoint
                if(endpoint.relIndex > oldEndpointRelIndex) {
                    var newRelIndex = endpoint.relIndex - 1;
                    anchor = diagram.calculateAnchor(idBox, idAllRels, newRelIndex);
                    endpoint.relIndex = newRelIndex;

                } else {
                    anchor = diagram.calculateAnchor(idBox, idAllRels, endpoint.relIndex);
                }
                endpoint.anchor.y = anchor;
            }
        }

        // We treat the alias if we have the boxAlias defined
        if(boxAlias) {
            // We remove the boxAlias in the other selects
            diagram.removeAlias(name, boxAlias, "relationship");

            // We remove the boxAlias of the list
            var aliasIndex = diagram.reltypesList[name].indexOf(boxAlias);
            diagram.reltypesList[name].splice(aliasIndex, 1);
        }

        // We check if we have only one box to hide the selects for the alias
        diagram.hideSelects(name, "relationship");

        jsPlumb.repaintEverything();
    });

    /**
     * Add the handler to remove the wire
     */
    $("#diagramContainer").on('change', '.edit-alias', function() {
        // We get all the alias for the type to change if the alias is in another box
        var newAlias = $(this).val();
        var modelId = $(this).data("modelid");
        var oldAlias = $(this).data("oldvalue");
        var typeName = $(this).data("typename");
        var selectsAlias = $('.select-nodetype-' + typeName);
        $.each(selectsAlias, function(index, select) {
            if($(select, 'option:selected').val() == oldAlias) {
                newOption = $("<OPTION>");
                newOption.addClass("option-nodetype-" + typeName);
                newOption.attr('id', typeName + diagram.nodetypesCounter[typeName]);
                newOption.attr('value', newAlias);
                newOption.attr('data-modelid', modelId);
                newOption.attr('selected', 'selected');
                newOption.html(newAlias);
                $(select).append(newOption);
            }
        });
    });

    /**
     * Bind methods for control jsPlumb events
     */

    jsPlumb.bind("connection", function(info) {
        var scopeSource = info.sourceEndpoint.scopeSource;
        var scopeTarget = info.targetEndpoint.scopeTarget;

        var compare = scopeSource != scopeTarget;
        var compareWildcard = (scopeSource == "wildcard") ||
                                (scopeTarget == "wildcard");

        if(!compare || compareWildcard) {
            var sourceIdValue = info.sourceId;
            var targetIdValue = info.targetId;

            var idBoxRel = info.connection.getOverlays()[2].id;
            // We store the name in the label variable
            var nameRel = info.connection.getOverlays()[1].label;
            info.connection.idrel = idBoxRel;

            // We select the index of the element for select it for the alias
            var elem = $('.select-reltype-' + nameRel + ' #' + nameRel + (diagram.reltypesCounter[nameRel])).length - 1;
            $($('.select-reltype-' + nameRel + ' #' + nameRel + (diagram.reltypesCounter[nameRel]))[elem]).attr('selected', 'selected');

            diagram.CounterRels++;

            $('.endpoint-image').css('visibility', 'visible');
            info.sourceEndpoint.addClass("endpointInvisible");
            info.targetEndpoint.removeClass("dragActive");
            info.targetEndpoint.removeClass("dropHover");

            // We check if we have more than one box to show the selects for the alias
            diagram.showSelects(nameRel, "relationship");
        } else {
            jsPlumb.detach(info.connection);
        }

        var selector = '#' + info.targetEndpoint.elementId + ' .title';
        $(selector).on('mouseover', function() {
            $(selector).css({
                "box-shadow": ""
            });
        });
    });

    jsPlumb.bind("connectionDrag", function(connection) {
        // We make the endpoint invisible
        $('.endpoint-image').css('visibility', 'hidden');

        // We make the drag css style for nodes with the correct target
        var scopeSource = connection.endpoints[0].scopeSource;

        jsPlumb.selectEndpoints().each(function(endpoint) {
            var scopeTarget = endpoint.scopeTarget;
                if(scopeTarget) {
                var compare = scopeSource == scopeTarget;
                var compareWildcard = (scopeSource == "wildcard") ||
                                        (scopeTarget == "wildcard");
                if(compare || compareWildcard) {
                    endpoint.addClass("dragActive");
                    var selector = '#' + endpoint.elementId + ' .title';
                    $(selector).on('mouseover', function() {
                        $(selector).css({
                            "box-shadow": "0 0 1em 0.75em #348E82"
                        });
                    });
                    $(selector).on('mouseout', function() {
                        $(selector).css({
                            "box-shadow": ""
                        });
                    });
                }
            }
        });
    });

    jsPlumb.bind("connectionDragStop", function(connection) {
        jsPlumb.selectEndpoints().each(function(endpoint) {
            endpoint.removeClass("dragActive");
            var selector = '#' + endpoint.elementId + ' .title';
            $(selector).on('mouseover', function() {
                $(selector).css({
                    "box-shadow": ""
                });
            });
        });
    });

    // /**
    //  * Handler for create the JSON file
    //  */
    // $(document).on('click', '#run-button', function(event) {
    //     var query = diagram.generateQuery();
    //     console.log("query: ");
    //     console.log(query);

    //     var queryJson = JSON.stringify(query);

    //     $.ajax({
    //         type: "POST",
    //         url: diagram.url_query,
    //         data: {"query": queryJson},
    //         success: function (data) {}
    //     });
    // });

    /**
     * Handler for create the JSON file
     */
    $(document).on('click', '#form-run-query', function(event) {
        var queryElements = diagram.saveQuery();
        var query = queryElements['query'];
        var query_aliases = queryElements['aliases'];
        var query_fields = queryElements['fields'];

        var queryJson = JSON.stringify(query);
        var queryAliases = JSON.stringify(query_aliases);
        var queryFields = JSON.stringify(query_fields);

        $('input[id=query]').val(queryJson);
        $('input[id=query_aliases]').val(queryAliases);
        $('input[id=query_fields]').val(queryFields);

        return true;
    });

    /**
     * Handler to get the information to save the query
     */
    $(document).on('click', '#save-query', function(event) {
        var queryElements = diagram.saveQuery();
        // We are going to assign the values for the elements of the form
        var numberOfResults = $('.content-table tr').length;
        $('#id_results_count').val(numberOfResults);
        $('#id_last_run').val('1987-11-01');
        $('#id_query_dict').val(JSON.stringify(queryElements['query']));
        $('#id_query_aliases').val(JSON.stringify(queryElements['aliases']));
        $('#id_query_fields').val(JSON.stringify(queryElements['fields']));

        //event.preventDefault();

        return true;
    });

    $(document).ready(init);

})(jQuery);