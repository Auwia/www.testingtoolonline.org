testApp.controller('recordCtrl', ['$scope', '$uibModal', function($scope, $uibModal) {
	$scope.Math = Math;
	$scope.records = [];
	$scope.value = 20;
	$scope.min = 1;
	$scope.max = 255;
	$scope.counterLen = 1;
	$scope.rangeFrom = 0;
	$scope.rangeTo = 1;
	$scope.decimalN = 0;
	$scope.cont = 0;
	$scope.contCounter = 0;
	$scope.types = ["text", "date", "number"];
	$scope.date = new Date();

        function serializeConfig($scope) {
          return {
            version: "1.0",
            fileName: $scope.fileName || "",
            rows_number: $scope.nRows || 1,
            length_type: $scope.length_type || "Fixed",
            separator: $scope.separator || "",
            eol: $scope.eol,
            eol_custom: $scope.eol_custom,
            table_structure: angular.copy($scope.records || [])
          };
        }
        
        function applyConfig($scope, cfg) {
          if (!cfg) return;
          $scope.fileName   = cfg.fileName || "";
          $scope.nRows      = parseInt(cfg.rows_number, 10) || 1;
          $scope.length_type= cfg.length_type || "Fixed";
          $scope.separator  = typeof cfg.separator === "string" ? cfg.separator : "";
          $scope.eol        = cfg.eol;
          $scope.eol_custom = cfg.eol_custom;
          $scope.records    = angular.isArray(cfg.table_structure) ? cfg.table_structure : [];
          $scope.nColumns   = $scope.records.length || 1;
        }
	
	$(function() {
		$("#table_conf").sortable({
			items: 'tr:not(tr:first-child)',
			cursor: 'pointer',
			axis: 'y',
			dropOnEmpty: true,
			placeholder: "sortable-placeholder",
			start: function(e, ui) {
				ui.item.addClass("selected");
				$scope.index_start = ui.item.index();
			},
			update: function(e, ui) {
				$scope.index_stop = ui.item.index();
			},
			stop: function(e, ui) {
				ui.item.removeClass("selected");
				if (typeof $scope.index_start !== 'undefined' && typeof $scope.index_stop !== 'undefined') {
					$scope.swap($scope.records, $scope.index_start - 1, $scope.index_stop - 1);
				}
			}
		});
	});

	$scope.swap = function(input, index_A, index_B) {
		var temp = input[index_A];
		input[index_A] = input[index_B];
		input[index_B] = temp;
	}

	$scope.getDate = function() {
		if (!$scope.dateRangeAct) {
			return new Date();
		}
	}
	
	$scope.check = function() {
		console.log("CIAO MASSIMO");
		if ($scope.batch) return true; else return false;
	}

	function decimalPlaces(num) {
		var match = ('' + num).match(/(?:\.(\d+))?(?:[eE]([+-]?\d+))?$/);
		if (!match) {
			return 0;
		}
		return Math.max(
			0,
			// Number of digits right of decimal point.
			(match[1] ? match[1].length : 0)
			// Adjust for scientific notation.
			-
			(match[2] ? +match[2] : 0));
	}

	$scope.getColor = function() {
		var color = '';
		if (angular.isUndefined($scope.decimalN)) {
			color = 'red';
		} else {
			color = 'black';
		}
		if (angular.isUndefined($scope.rangeFrom) || angular.isUndefined($scope.rangeTo) || $scope.rangeFrom > $scope.rangeTo) {
			color = 'red';
		}
		if ($scope.getRemaining() < 0) {
			$scope.MAX = $scope.decimalN;
			color = 'red';
		} else {
			if (angular.isDefined($scope.rangeFrom) && angular.isDefined($scope.rangeTo)) {
				$scope.MAX = $scope.length - Math.max($scope.rangeFrom.toString().length, $scope.rangeTo.toString().length) - ($scope.decimalAct ? 1 : 0) // -1 is for the separator;
			} else {
				$scope.MAX = $scope.length - 1;
			}
			color = 'black';
		}
		return color;
	};

	$scope.editAll = function() {
		if (document.getElementById("editAll").checked == false) {
			for (var i = 0; i < $scope.records.length; i++) {
				$scope.records[i].checked = false;
			}
		} else {
			for (var i = 0; i < $scope.records.length; i++) {
				$scope.records[i].checked = true;
			}
		}
	};

	$scope.editSingle = function(index) {
		for (var i = 0; i < $scope.records.length; i++) {
			if ($scope.records[i].checked == false) {
				$scope.checked = false;
			}
		}
	};

	$scope.delete = function(index) {
		$scope.records.splice(index, 1);
		$scope.nColumns = $scope.records.length;
	};

	$scope.reset = function() {
		$scope.prefixLen = "";
		$scope.suffixLen = "";
		$scope.counterLen = 1;
		$scope.separator = "";
		$scope.decimalN = 0;
		$scope.dateRangeFrom = "";
		$scope.dateRangeTo = "";
		$scope.dateRangeFormat = "YYYYMMDD";
		$scope.records = [];
		$scope.length_type = "Fixed";
		$scope.fileName = "";
		$scope.nRows = 100;
		$scope.nColumns = 1;
		$scope.checked = false;
	};

	$scope.hard_reset = function() {
		$scope.fileName = "max";
		$scope.prefixLen = "";
		$scope.suffixLen = "";
		$scope.counterLen = 1;
		$scope.rangeFrom = 0;
		$scope.rangeTo = 1;
		$scope.separator = "";
		$scope.decimalN = 0;
		$scope.dateRangeFrom = "";
		$scope.dateRangeTo = "";
	}

	$scope.addRow = function() {
		$scope.checked = false;
		$scope.cont ++;
		$scope.nColumns = $scope.cont;
		$scope.records.push({
					'checked': false,
					'name': 'random' + $scope.cont,
					'type': 'text',
					'max_length': 10,
					'fixed_value': '',
					'alignment': 'left',
					'prefix': '',
					'suffix': '',
					'counter': 0,
					'date_format': 'YYYYMMDD',
					'date_range_from': '',
					'date_range_to': '',
					'number_range_from': '',
					'number_range_to': '',
					'decimal_separator': '',
					'n_decimal': 0
		});
	};
	
	$scope.add = function() {
		$scope.checked = false;
		if ($scope.records.length <= $scope.nColumns) {
			for (var i = $scope.records.length; i < $scope.nColumns; i++) {
				$scope.cont++;
				$scope.records.push({
					'checked': false,
					'name': 'random' + $scope.cont,
					'type': 'text',
					'max_length': 10,
					'fixed_value': '',
					'alignment': 'left',
					'prefix': '',
					'suffix': '',
					'counter': 0,
					'date_format': 'YYYYMMDD',
					'date_range_from': '',
					'date_range_to': '',
					'number_range_from': '',
					'number_range_to': '',
					'decimal_separator': '',
					'n_decimal': 0
				});
			}
		} else {
			$scope.records.splice($scope.nColumns - $scope.records.length);
		}
	};

	$scope.edit = function(index) {
		$scope.records.splice(index, 1);
	};

        $scope.saveConf = function() {
          var obj = {
            version: "1.0",
            fileName: $scope.fileName,
            rows_number: $scope.nRows,
            length_type: $scope.length_type,
            separator: $scope.separator,
            eol: $scope.eol,
            eol_custom: $scope.eol_custom,
            table_structure: $scope.records
          };
          // salva SOLO su file (niente cookie / localStorage)
          saveTextAsFile(JSON.stringify(obj), $scope.fileName);
        };

	$scope.uploadFile = function() {
		var input = document.createElement('input');
		input.type = 'file';
		input.onchange = e => {
			var files = e.target.files[0];
			var reader = new FileReader();
			console.log("File uploaded: " + files.name);
			reader.onloadend = function() {
				if (this.readyState == FileReader.DONE) {
					$scope.$apply(function($scope) {
						var file_conf = JSON.parse(reader.result);
						$scope.fileName = file_conf.fileName;
						$scope.nRows = file_conf.rows_number;
						$scope.length_type = file_conf.length_type;
						$scope.separator = file_conf.separator;
						$scope.eol = file_conf.eol;
						$scope.eol_custom = file_conf.eol_custom;
						$scope.records = [];
						$scope.records = file_conf.table_structure;
						$scope.nColumns = $scope.records.length;
						var cont = 0;
						for (var i = 0; i < $scope.records.length; i++) {
							if (!$scope.records[i].checked) {
								cont = 1;
							}
						}
						if (cont == 0) {
							$scope.checked = true;
						}
					});
				}
			};
			reader.readAsText(files);
		}
		input.click();
	}

	$scope.generateFile = function() {
		var file = [];
		var counter_tmp = 0;
		for (var i = 0; i < $scope.nRows; i++) {
			var output = [];
			var cont_attributes = 1;
			for(var z=0; z < $scope.records.length; z++) {
				if ($scope.records[z].type == "number") {
					output += randomNumber($scope.records[z].max_length, $scope.records[z].alignment, $scope.records[z].number_range_from, $scope.records[z].number_range_to, $scope.records[z].decimal_separator, $scope.records[z].n_decimal);
				}
				if ($scope.records[z].type == "text") {
					var temp;
					if (angular.isUndefined($scope.records[z].fixed_value) || $scope.records[z].fixed_value == "") {
						// console.log("TYPE: TXT => prefix: " + $scope.records[z].prefix + "counter: " + $scope.records[z].counter + " suffix: " + $scope.records[z].suffix);
						if (counter_tmp > calculateMax($scope.records[z].counter)) {
							counter_tmp = 0;
						}
						tmp = randomText($scope.records[z].max_length, $scope.records[z].alignment, $scope.records[z].prefix, $scope.records[z].counter, $scope.records[z].suffix, counter_tmp, $scope.records[z].fillZeroAct);
						counter_tmp++;
						output += tmp;
						// console.log("TYPE: TXT => random text generated: " + tmp);
					} else {
						tmp = addBlankSpace($scope.records[z].fixed_value, $scope.records[z].alignment, $scope.records[z].max_length);
						output += tmp;
						// console.log("TYPE: TXT => fixed value formatted: " + tmp);
					}
				}
				if ($scope.records[z].type == "date") {
					var format = $scope.records[z].date_format;
					var rangeFrom = $scope.records[z].date_range_from;
					var rangeTo = $scope.records[z].date_range_to;
					if (angular.isUndefined(format)) {
						format = 'DDmmYYYY';
					}
					if (angular.isUndefined(rangeFrom)) {
						rangeFrom = new Date();
					}
					if (angular.isUndefined(rangeTo)) {
						rangeTo = new Date();
					}
					output += randomDate(rangeFrom, rangeTo, format, $scope.records[z].alignment, $scope.records[z].max_length);
				}
				if ($scope.length_type == 'Variable' && $scope.records.length > 1 && cont_attributes < $scope.records.length) {
					cont_attributes ++;
					output += $scope.separator;
				}
			}
			if ($scope.eol == 'Carriage Return (CR)') {
				file += output.concat('\r');
			}
			if ($scope.eol == 'Line Feed (LF)') {
				file += output.concat('\n');
			}
			if ($scope.eol == 'End of Line (EOL)') {
				file += output.concat('\r\n');
			}
			if ($scope.eol == 'custom') {
				file += output.concat($scope.eol_custom);
			}
		}
		$scope.output = file;
		saveTextAsFile(file, $scope.fileName);
		$scope.myForm.$setPristine();
		$scope.myForm.$setUntouched();
		$scope.contCounter = 0;
	};
	function saveTextAsFile(data, filename) {
		if (!data) {
			console.error('Console.save: No data')
			return;
		}
		if (!filename) filename = 'default.txt'
		var blob = new Blob([data], {
				type: 'text/plain'
			}),
			e = document.createEvent('MouseEvents'),
			a = document.createElement('a')
		// FOR IE:
		if (window.navigator && window.navigator.msSaveOrOpenBlob) {
			window.navigator.msSaveOrOpenBlob(blob, filename);
		} else {
			var e = document.createEvent('MouseEvents'),
				a = document.createElement('a');
			a.download = filename;
			a.href = window.URL.createObjectURL(blob);
			a.dataset.downloadurl = ['text/plain', a.download, a.href].join(':');
			e.initEvent('click', true, false, window,
				0, 0, 0, 0, 0, false, false, false, false, 0, null);
			a.dispatchEvent(e);
		}
	}

	function calculateMin(x) {
		return (Math.pow(10, x - 1) - 1) * -1;
	}

	function calculateMax(x) {
		return Math.pow(10, x) - 1;
	}

	function addBlankSpace(text, alignment, length) {
		if (alignment == "left") {
			text += new Array((length - text.length) + 1).join(' ');
		}
		if (alignment == "right") {
			text = new Array((length - text.length) + 1).join(' ') + text;
		}
		return text;
	};

	function addZero(number, length, alignment) {
		if (alignment == "left") {
			number += new Array((length - number.length) + 1).join('0');
		}
		if (alignment == "right") {
			number = new Array((length - number.length) + 1).join('0') + number;
		}
		return number;
	};

	function randomText(len, alignment, prefix, counter, suffix, i, fillZeroAct) {
		var text = "";
		var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
		if (prefix != null && prefix != '' && angular.isDefined(prefix)) {
			text = prefix;
		}
		if (counter != null && counter > 0) {
			if (i <= calculateMax(counter)) {

			} else {
				i = 0;
			}
			if (fillZeroAct) {
				text += addZero(i.toString(), counter, alignment);
			} else {
				text += addBlankSpace(i.toString(), alignment, counter);
			}
		}
		for (var i = 0; i < len - prefix.length - counter - suffix.length; i++)
			text += possible.charAt(Math.floor(Math.random() * possible.length));
		if (suffix != null && angular.isDefined(suffix)) {
			text += suffix;
		}
		return text;
	}

	function randomNumber(max_length, align, rangeFrom, rangeTo, decimal_separator, nDecimals) {
		var len = max_length;
		if (angular.isDefined(nDecimals) && nDecimals > 0) {
			len -= nDecimals+1; // +1 decimal separator
		}
		if ( (angular.isUndefined(rangeFrom) || rangeFrom.toString() == "") && ( angular.isUndefined(rangeTo) || rangeTo.toString() == "")) {
			min = calculateMin(len);
			max = calculateMax(len);
		} 
		if (angular.isUndefined(rangeFrom) && angular.isDefined(rangeTo)) {	
			min = calculateMin(len-rangeTo.toString().length);
			max = rangeTo;
		} 
		if (angular.isDefined(rangeFrom) && angular.isUndefined(rangeTo)) {	
			min = rangeFrom;
			max = calculateMax(len-rangeFrom.toString().length);
		} 
		if (angular.isDefined(rangeFrom) && rangeFrom.toString() !== "" && angular.isDefined(rangeTo) && rangeTo.toString() !== "") {
			min = rangeFrom;
			max = rangeTo;
		} 
		var rndNum = parseFloat(Math.random() * (max - min) + min).toFixed(nDecimals);
		var text = String(rndNum);
		if (text.length < max_length) {
			text = addBlankSpace(text, align, max_length);
		}
		if (decimal_separator == null) {
			return text;
		} else {
			return text.replace('.', decimal_separator);
		}
	}

	function randomDate(start, end, format, alignment, max_length) {
		if (angular.isDefined(start) && start != '') {
			start = Date.parse(start);
		} else {
			start = new Date(1990, 1, 1).getTime();
		}
		if (angular.isDefined(end) && end != '') {
			end = Date.parse(end)
		} else {
			end = new Date().getTime();
		}
		var rndDate = moment(new Date(start + Math.random() * (end - start))).format(format);
		var text = String(rndDate);
		if (text.length < max_length) {
			text = addBlankSpace(text, alignment, max_length);
		}
		return text;
	}

	$scope.loadModal = function(index, kind, max_length, records) {
                try { var ae = document.activeElement; if (ae && ae.blur) ae.blur(); } catch(e) {}

		if (kind == 'text') {
			$uibModal.open({
                                appendTo: angular.element(document.body),
				templateUrl: 'modalTextFormatHelper.html',
				controller: function($scope) {
					$scope.max_length = records[index].max_length;
					$scope.fixedString = records[index].fixed_value;
					$scope.prefixLen = records[index].prefix;
					$scope.suffixLen = records[index].suffix;
					$scope.counterLen = records[index].counter;
					$scope.fillZeroAct = records[index].fillZeroAct;
					$scope.apply = function() {
						records[index].format = $scope.prefixLen + "+" + $scope.counterLen + "+" + $scope.suffixLen;
						records[index].fixed_value = $scope.fixedString;
						records[index].prefix = $scope.prefixLen;
						records[index].suffix = $scope.suffixLen;
						records[index].counter = $scope.counterLen;
						records[index].fillZeroAct = $scope.fillZeroAct;
						$scope.hard_reset();
						$scope.$close();
					};
					$scope.hard_reset = function() {};
					$scope.getRemaining = function() {
						return max_length - $scope.getUsage();
					};
					$scope.getUsage = function() {
						var usage = 0;

						if (angular.isDefined($scope.prefixLen)) {
							usage += $scope.prefixLen.length;
						}
						if (angular.isDefined($scope.counterLen)) {
							usage += $scope.counterLen;
						}
						if (angular.isDefined($scope.suffixLen)) {
							usage += $scope.suffixLen.length;
						}
						if (angular.isDefined($scope.fixedString)) {
							usage += $scope.fixedString.length;
						}
						return usage;
					};
				},
				size: 'auto'
			}).result.then(function() {}, function() {});
		}
		if (kind == 'number') {
			$uibModal.open({
                                appendTo: angular.element(document.body),
				templateUrl: 'modalNumberFormatHelper.html',
				controller: function($scope) {
					$scope.max_length = records[index].max_length;
					$scope.getRemaining = function() {
						return records[index].max_length - $scope.getUsage();
					};
					$scope.getUsage = function() {
						var usage = 0, len = $scope.max_length, min, max;
						if ($scope.decimalN > 0 && $scope.decimalN !== "") {
							usage += $scope.decimalN+1; // +1 decimal separator
						}
						if ($scope.rangeFrom == null) {
							$scope.rangeFrom = undefined;
						}
						if ($scope.rangeTo == null) {
							$scope.rangeTo = undefined;
						}
						if (angular.isUndefined($scope.rangeFrom) && angular.isDefined($scope.rangeTo)) {	
							min = calculateMin(len-$scope.rangeTo.toString().length-usage);
							max = $scope.rangeTo;
						} 
						if (angular.isDefined($scope.rangeFrom) && angular.isUndefined($scope.rangeTo)) {	
							min = $scope.rangeFrom;
							max = calculateMax(len-$scope.rangeFrom.toString().length-usage);
						} 
						if (angular.isDefined($scope.rangeFrom) && $scope.rangeFrom.toString() !== "" && angular.isDefined($scope.rangeTo) && $scope.rangeTo.toString() !== "") {
							min = $scope.rangeFrom;
							max = $scope.rangeTo;
						} 
						if ( (angular.isUndefined($scope.rangeFrom) || $scope.rangeFrom.toString() == "") && (angular.isUndefined($scope.rangeTo) || $scope.rangeTo.toString() == "")) {
							// min = calculateMin(len-usage);
							// max = calculateMax(len-usage);
							usage -= 0;
						} 
						if (angular.isDefined(min) && angular.isDefined(max)){
							usage += Math.max(min.toString().length, max.toString().length);
						}
						return usage;
					};
					
					if (records[index].number_range_from == null || angular.isUndefined(records[index].number_range_from) || records[index].number_range_from.toString() == "") {
						// $scope.rangeFrom = calculateMin($scope.getRemaining());
					} else {
						$scope.rangeFrom = records[index].number_range_from;
					}
					if (records[index].number_range_to == null || angular.isUndefined(records[index].number_range_to) || records[index].number_range_to.toString() == "") {
						// $scope.rangeTo = calculateMax($scope.getRemaining());
					} else {
						$scope.rangeTo = records[index].number_range_to;
					}
					if (records[index].n_decimal == '' || angular.isUndefined(records[index].n_decimal) || records[index].n_decimal < 1) {
						$scope.decimalN = 0;
					} else {
						$scope.decimalN = records[index].n_decimal;
					}
					if (records[index].decimal_separator == '' || angular.isUndefined(records[index].decimal_separator)) {
					} else {
						$scope.decimal_separator = records[index].decimal_separator;
					}
					
					$scope.apply = function() {
						records[index].number_range_from = $scope.rangeFrom;
						records[index].number_range_to = $scope.rangeTo;
						records[index].decimal_separator = $scope.decimal_separator;
						records[index].n_decimal = $scope.decimalN;
						$scope.hard_reset();
						$scope.$close();
					};
					$scope.hard_reset = function() {};
				},
				size: 'auto'
			}).result.then(function() {}, function() {});;
		}
		if (kind == 'date') {
			$uibModal.open({
                                appendTo: angular.element(document.body),
				templateUrl: 'modalDateFormatHelper.html',
				controller: function($scope) {
					$scope.max_length = records[index].max_length;
					$scope.rangeDateFormat = records[index].date_format;
					$scope.dateRangeFrom = records[index].date_range_from;
					$scope.dateRangeTo = records[index].date_range_to;
					$scope.apply = function() {
						records[index].date_format = $scope.rangeDateFormat;
						records[index].date_range_from = $scope.dateRangeFrom;
						records[index].date_range_to = $scope.dateRangeTo;
						$scope.hard_reset();
						$scope.$close();
					};
					$scope.hard_reset = function() {};
					$scope.getRemaining = function() {
						return $scope.max_length - $scope.getUsage();
					};
					$scope.getUsage = function() {
						var usage = 0;
						if (angular.isDefined($scope.rangeDateFormat)) {
							usage += $scope.rangeDateFormat.length;
						}
						return usage;
					};
					$scope.randomDate = function(start, end, format, alignment) {
						if (angular.isDefined(start) && start != '') {
							start = start.getTime();
						} else {
							start = new Date().getTime();
						}
						if (angular.isDefined(end) && end != '') {
							end = end.getTime();
						} else {
							end = new Date().getTime();
						}
						return moment(new Date(start + Math.random() * (end - start))).format(format);
					};
					$scope.loadInfo = function() {
						$uibModal.open({
                                                        appendTo: angular.element(document.body),
							templateUrl: 'modalInfo.html',
							controller: '',
							size: 'auto'
							}).result.then(function() {}, function() {});
					};
				},
				size: 'auto'
			}).result.then(function() {}, function() {}); 
		}
		if (kind == 'help') {
			$uibModal.open({
                                appendTo: angular.element(document.body),
				templateUrl: 'modalHelp.html',
				controller: 'recordCtrl',
				size: 'auto'
			}).result.then(function() {}, function() {});
		}
	};
}]);
