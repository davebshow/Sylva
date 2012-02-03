# -*- coding: utf-8 -*-
import simplejson

from django.contrib.auth.decorators import login_required
from django.shortcuts import (get_object_or_404, render_to_response,
                                HttpResponse)
from django.template import RequestContext
from guardian.decorators import permission_required

from data.models import Data
from graphs.models import Graph

from converters import GEXFConverter


@login_required()
def graph_import_tool(request, graph_id):
    graph = get_object_or_404(Graph, id=graph_id)
    # Schema jsonification
    schema = graph.schema.export()
    schema_json = {"nodeTypes": {}, "allowedEdges":{}}
    for node_type in schema["node_types"]:
        attribute_names = [n.key for n in node_type.properties.all()]
        attributes = dict(zip(attribute_names, attribute_names))
        schema_json["nodeTypes"][node_type.name] = attributes
    for edge_type in schema["relationship_types"]:
        edge_name = "%s_%s_%s" % (edge_type.source.name,
                                edge_type.name,
                                edge_type.target.name)
        schema_json["allowedEdges"][edge_name] = {
                "source": edge_type.source.name,
                "label": edge_type.name,
                "target": edge_type.target.name}
    return render_to_response('graph_import_tool.html', {
                                "graph": graph,
                                "sylva_schema": simplejson.dumps(schema_json),
                            },
                            context_instance=RequestContext(request))


@permission_required("data.change_data", (Data, "graph__id", "graph_id"))
def ajax_node_create(request, graph_id):
    graph = get_object_or_404(Graph, id=graph_id)
    data = request.GET.copy()
    properties = simplejson.loads(data["properties"])
    label = graph.schema.nodetype_set.get(name=data["type"])
    node = graph.nodes.create(str(label.id), properties)
    return HttpResponse(simplejson.dumps({"id": node.id}))


@permission_required("data.change_data", (Data, "graph__id", "graph_id"))
def ajax_relationship_create(request, graph_id):
    graph = get_object_or_404(Graph, id=graph_id)
    data = request.GET.copy()
    source = graph.nodes.get(data["sourceId"])
    target = graph.nodes.get(data["targetId"])
    label = graph.schema.relationshiptype_set.get(name=data["type"],
            source=source.label,
            target=target.label)
    properties = {}
    graph.relationships.create(source, target, str(label.id), properties)
    return HttpResponse(simplejson.dumps({}))


@permission_required("data.view_data", (Data, "graph__id", "graph_id"))
def graph_export_tool(request, graph_id):
    graph = get_object_or_404(Graph, id=graph_id)
    converter = GEXFConverter(graph)
    response = HttpResponse(converter.stream_export(), mimetype='application/xml')
    response['Content-Disposition'] = \
            'attachment; filename=%s.gexf' % graph.name
    return response




