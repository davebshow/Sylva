'use strict'


var services = angular.module('reports.services', ['ngResource']);


services.factory('api', ['$resource', function ($resource) {

    var reports = $resource('/reports/:graphSlug/reports', {}, {
        query: {method:'GET', isArray:true},
        save: {method:'POST'}
    });

    var queries = $resource('/reports/:graphSlug/queries', {}, {
        query: {method:'GET', isArray:true}
    });

    return {
        reports: reports,
        queries: queries
    };
}]);


services.factory('parser', ['$location', function ($location) {

    function Parser() {
        this.parser = document.createElement('a')
        this.parser.href = $location.absUrl();
    }

    Parser.prototype.parse = function () {
        return this.parser.pathname.split('/')[2]
    }

    return new Parser();
}]);


services.factory('tableArray', function () {

    function TableArray(tableArray, rowWidth) {
        this.table = tableArray;
        this.rowWidth = rowWidth;
        this.numRows = tableArray.length;
        this.numCols = tableArray[0].length;
    };

    TableArray.prototype.getAdjCells = function(row, col) {
        var adjs = [];
        if (this.table[row][col - 1]) adjs.push('left');
        if (row !== 0 && this.table[row - 1][col]) adjs.push('up');
        if (this.table[row][col + 1]) adjs.push('right');
        if (row < this.table.length - 1 && this.table[row + 1][col]) adjs.push('down');
        return adjs;
    };

    TableArray.prototype.addRow = function() { 
        var row = []
        ,   cellId = this.getId();
        for (var i=0; i<this.numCols; i++) {
            var cell = {col: i, colspan: '1', id: 'cell' + cellId, row: this.numRows, rowspan: '1'};
            row.push(cell)
            cellId++
        }   
        this.table.push(row) 
        this.numRows++     
    };

    TableArray.prototype.addCol = function() {
        var cellId = 0;
        for (var i=0; i<this.numRows; i++) {
            var row = this.table[i]
            ,   rlen = row.length
            ,   cell = {col: rlen, colspan: '1', id: '', row: i, rowspan: '1'};
            row.push(cell);
            var newRlen = rlen + 1;
            for (var j=0; j<newRlen; j++) {
                row[j].id = 'cell' + cellId;
                cellId++
            }     
        }
        this.numCols++
    };

    TableArray.prototype.htmlify = function() {
        var html = '' 
        // this will go to j loop to check for colspan etc.
        ,   width = this.rowWidth / this.numCols - ((this.numCols + 1) * 2 / this.numCols) + 'px';
        for (var i=0; i<this.numRows; i++) {
            var row = this.table[i]
            ,   rlen = row.length
            ,   cells = '';
            for (var j=0; j<rlen; j++) {
                var cell = row[j]
                if (j === this.numCols - 1) {
                    cells += 
                        '<div sylva-droppable sylva-merge-cells class="tcell final" id=' + cell.id + 
                        '" style="width:' + width + 
                        ';" row="' + cell.row +
                        '" rowspan="' + cell.rowspan +
                        '" col="' + cell.col +
                        '" colspan="' + cell.colspan + 
                        '"></div>';
                } else {
                    cells += 
                        '<div sylva-droppable sylva-merge-cells class="tcell" id=' + cell.id + 
                        '" style="width:' + width + 
                        ';" row="' + cell.row +
                        '" rowspan="' + cell.rowspan +
                        '" col="' + cell.col +
                        '" colspan="' + cell.colspan + 
                        '"></div>';
                }
            }
            if (i === this.numRows - 1) {
                html += '<div class="trow bottom">' + cells + '</div>';
            } else {
                html += '<div class="trow">' + cells + '</div>';
            }
        }
        return html;
    };

    TableArray.prototype.jsonify = function() {
        console.log('jsonify')
    };

    TableArray.prototype.getId = function() {
        var id = 0
        ,   tlen = this.table.length;
        for (var i=0; i<tlen; i++) {
            id += this.table[i].length
        }
        return id
    };

    return function (table, rowWidth) {
        return new TableArray(table, rowWidth);
    }
});
