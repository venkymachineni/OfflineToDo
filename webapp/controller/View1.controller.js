sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/m/GroupHeaderListItem",
	"UI5ConOnlineApp/formatter/formatter"
], function(Controller, GroupHeaderListItem, formatter) {
	"use strict";

	return Controller.extend("UI5ConOnlineApp.controller.View1", {
		formatter: formatter,
		onInit: function() {},
		onBeforeRendering: function() {
			var oJSONModel = this.getView().getModel("oJSONModel");
			var oDataModel = this.getView().getModel();
			var db = new PouchDB('LocalToDos');
			db.allDocs().then(function(result) {
				// Promise isn't supported by all browsers; you may want to use bluebird
				return Promise.all(result.rows.map(function(row) {
					return db.remove(row.id, row.value.rev);
				}));
			}).then(function() {
				// done!
			}).catch(function(err) {
				// error!
			});

			// db.allDocs({
			// 			include_docs: true,
			// 			attachments: true
			// 		}).then(function(result) {
			// 		for(var i = 0; i<result.rows.length; i++){
			// 			result.rows[i].doc["_deleted"] = true;
			// 			}

			// 		db.bulkDocs(result.rows).then(function(doc) {
			// 			console.log('Successfully posted a todo!');
			// 			// handle result
			// 		}).catch(function(err) {
			// 			console.log(err);
			// 		});
			// 		}).catch(function(err) {
			// 			console.log(err);
			// 		});

			oDataModel.read("/ToDos", {
				success: function(oData) {
					jQuery.each(oData.results, function(index, value) {
						//value._id = new Date().toISOString();
						delete value.__metadata;

					});

					db.bulkDocs(oData.results).then(function(result, doc) {
						console.log('Successfully posted a todo!');
						// handle result
					}).catch(function(err) {
						console.log(err);
					});

					db.allDocs({
						include_docs: true,
						attachments: true
					}).then(function(result) {
						oJSONModel.setData({
							"ToDos": result.rows
						});
					}).catch(function(err) {
						console.log(err);
					});

				},
				error: function(response) {

				}
			});
		},
		oDataCall: function() {
			var oJSONModel = this.getView().getModel("oJSONModel");
			var oDataModel = this.getView().getModel();
			oJSONModel.setData({
				"ToDos": null
			});
			oDataModel.read("/ToDos", {
				success: function(oData) {
					oJSONModel.setData({
						"ToDos": oData.results
					});

				},
				error: function(response) {

				}
			});
		},
		fnGetGroupHeader: function(oGroup) {
			return new GroupHeaderListItem({
				title: oGroup.key,
				upperCase: false
			}).addStyleClass("sapMH1Style");
		},
		handleNewToDoButtonPress: function() {
			// if (!oToDoDialog) {
			var oToDoDialog = sap.ui.xmlfragment("UI5ConOnlineApp.fragments.ToDoNew", this.getView().getController());
			// }
			//Bind Data
			this.getView().addDependent(oToDoDialog);
			//oToDoDialog.setModel(this.getView().getModel("oJSONModel"),"oJSONModel");
			var oList = this.byId("ToDoList");
			oToDoDialog.open();

		},
		fnSave: function(evt) {
			var oDataModel = this.getView().getModel();
			var oJSONModel = this.getView().getModel("oJSONModel");
			var Content = evt.getSource().getParent().getContent()[0].getItems()[0].getItems()[0].getValue();
			var Due = evt.getSource().getParent().getContent()[0].getItems()[0].getItems()[2].getDateValue();
			var Data = {
				"Content": Content,
				"DueDate": Due
			};
			var array = oJSONModel.getData().ToDos;
			array.push(Data);
			oJSONModel.setData({
				"ToDos": array
			});
			oDataModel.create("/ToDos", Data, {
				success: function(response) {

				}.bind(this),
				error: function(response) {

				}
			});
			evt.getSource().getParent().close();

		},
		fnEditToDo: function(evt) {
			if (!oToDoDialog) {
				var oToDoDialog = sap.ui.xmlfragment("UI5ConOnlineApp.fragments.ToDo", this.getView().getController());
			}
			//Bind Data
			this.getView().addDependent(oToDoDialog);
			//oToDoDialog.setModel(this.getView().getModel("oJSONModel"),"oJSONModel");
			var oList = this.byId("ToDoList");
			var oSelectedItem = oList.getSelectedItem();
			oToDoDialog.setBindingContext(oSelectedItem.getBindingContext("oJSONModel"), "oJSONModel");

			oToDoDialog.open();
			//Unselect the item, so that it can be selected again
			oList.setSelectedItem(oSelectedItem, false);
		},
		fnToDoDone: function(oEvent) {
			var itemId = oEvent.getSource().getParent().getBindingContext("oJSONModel").getObject().id;
			var Path = oEvent.getSource().getParent().getBindingContext("oJSONModel").sPath;
			this.getView().getModel("oJSONModel").setProperty(Path + "/Done", true);
			var Payload = this.getView().getModel("oJSONModel").getProperty(Path);
			//Mark as done
			var oModel = this.getView().getModel();
			oModel.update("/ToDos('" + itemId + "')", Payload, {
				success: this.mySuccessHandler(),
				error: this.myErrorHandler()
			});
		},
		mySuccessHandler: function(Response) {
			this.oDataCall();
		},
		myErrorHandler: function(error) {

		},
		fnClose: function(evt) {
			evt.getSource().getParent().close();
		}
	});

});