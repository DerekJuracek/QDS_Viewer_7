require([
  "esri/WebMap",
  "esri/views/MapView",
  "esri/widgets/LayerList",
  "esri/widgets/Slider",
  "esri/widgets/BasemapLayerList",
  "esri/widgets/Expand",
  "esri/widgets/Legend",
  "esri/widgets/Search",
  "esri/widgets/Home",
  "esri/widgets/DistanceMeasurement2D",
  "esri/widgets/AreaMeasurement2D",
  "esri/layers/FeatureLayer",
], function (
  WebMap,
  MapView,
  LayerList,
  Slider,
  BasemapLayerList,
  Expand,
  Legend,
  Search,
  Home,
  DistanceMeasurement2D,
  AreaMeasurement2D,
  FeatureLayer
) {
  const urlParams = new URLSearchParams(window.location.search);
  const configUrl = urlParams.get("config") || "North_Haven.json";

  fetch(configUrl)
    .then((response) => response.json())
    .then((config) => {
      const layers = config.layers;
      const configWebMapId =
        config.webmapId || "54a2ab42be274473af199afc614fdf78";
      // use the webMapPortalId in your app as needed

      const webmap = new WebMap({
        portalItem: {
          id: configWebMapId,
        },
      });

      // let layersMap = webmap.layers;

      // for (let layer of layersMap) {
      //   console.log(layer);
      // }

      // webmap.add(parcelFeatureLayer);

      const view = new MapView({
        container: "viewDiv",
        map: webmap,
        padding: {
          left: 300,
        },
      });

      async function defineActions(event) {
        const item = event.item;
        // console.log(item);
        // console.log(item.actionsSections);

        await item.layer.when();

        if (item.children.length < 1) {
          const opacityDiv = document.createElement("div");
          opacityDiv.innerHTML = "<p>Layer Opacity (%)</p>";
          opacityDiv.id = "opacityDiv";

          const labelDiv = document.createElement("div");
          labelDiv.innerHTML = "<p>Label Opacity (%)</p>";
          labelDiv.id = "opacityDiv";
          const opacitySlider = new Slider({
            container: opacityDiv,
            min: 0,
            max: 1,
            values: [0.75],
            precision: 2,
            visibleElements: {
              labels: true,
              rangeLabels: true,
            },
          });

          const labelSlider = new Slider({
            container: labelDiv,
            min: 0,
            max: 1,
            values: [1],
            precision: 2,
            visibleElements: {
              labels: true,
              rangeLabels: true,
            },
          });

          item.panel = {
            content: [opacityDiv, labelDiv],
            className: "esri-icon-sliders-horizontal",
            title: "Change layer settings",
            label: "Change layer settings",
          };

          opacitySlider.on("thumb-drag", (event) => {
            const { value } = event;
            item.layer.opacity = value;
          });

          labelSlider.on("thumb-drag", (event) => {
            const { value } = event;
            if (item.layer.labelingInfo) {
              item.layer.labelingInfo = item.layer.labelingInfo.map(
                (labelClass) => {
                  const newLabelClass = labelClass.clone();
                  newLabelClass.symbol.color.a = value;
                  newLabelClass.symbol.haloColor.a = value;
                  return newLabelClass;
                }
              );
            }
          });
        }
      }

      view.when(() => {
        const layerList = new LayerList({
          view,
          listItemCreatedFunction: defineActions,
          container: "layers-container",
        });
      });

      window.onload = function () {
        const togglePanelBtn = document.getElementById("toggle-panel-btn");
        const topbar = document.getElementById("topbar");
        const panelContent = document.getElementById("panel-content");
        const sidebar = document.getElementById("sidebar");

        togglePanelBtn.addEventListener("click", () => {
          togglePanelBtn.classList.toggle("rotated");
          console.log("I'm clicked");
          panelContent.classList.toggle("collapsed");

          if (panelContent.classList.contains("collapsed")) {
            sidebar.style.width = "0px";
            view.padding = { left: 0 };
          } else {
            sidebar.style.width = "300px";
            view.padding = { left: 300 };
          }
        });
      };

      view.ui.move("zoom", "top-left");

      const basemaps = new BasemapLayerList({
        view,
        basemapTitle: "Basemaps",
        expandIconClass: "esri-icon-layer-list",
        baseListItemCreatedFunction: function (event) {
          baseListItem = event.item;
          if (
            baseListItem.open &&
            (baseListItem.title === "Ortho 2012" ||
              baseListItem.title === "Ortho 2016" ||
              baseListItem.title === "Ortho 2019")
          ) {
            // Log title only when it's open
            console.log(baseListItem.title);
          }
        },
      });

      basemaps.visibleElements = {
        statusIndicators: true,
        baseLayers: true,
        referenceLayers: false,
        referenceLayersTitle: false,
        errors: true,
      };

      const basemapExpand = new Expand({
        view: view,
        content: basemaps,
        group: "top-right",
        index: 0,
        expandIconClass: "esri-icon-basemap",
      });

      const legend = new Legend({
        view: view,
        container: document.createElement("div"),
      });

      // Create the calcite-icon element
      const legendToggle = document.createElement("calcite-icon");
      legendToggle.setAttribute("icon", "legend");
      legendToggle.setAttribute("scale", "m");
      legendToggle.setAttribute("theme", "dark");
      legendToggle.style.cursor = "pointer";
      legendToggle.style.marginLeft = "170px";

      const layerDiv = document.getElementById("layerDiv");
      layerDiv.appendChild(legendToggle);

      let legendVisible = false;

      function toggleLegend() {
        if (legendVisible) {
          view.ui.remove(legend);
        } else {
          view.ui.add(legend, "top-right");
        }
        legendVisible = !legendVisible;
      }

      legendToggle.addEventListener("click", toggleLegend);

      // Create a new div element for the Search widget container and its configuration
      const searchWidgetContainer = document.createElement("div");
      searchWidgetContainer.id = "search-widget-container";

      const headerTitle = document.getElementById("header-title");
      const h2Element = headerTitle.querySelector("h2");

      const searchWidget = new Search({
        view: view,
        locationEnabled: false,
        searchAllEnabled: false,
        includeDefaultSources: false,
      });

      // Wait for the view to finish loading, then add the search bar
      view.when().then(function () {
        headerTitle.insertBefore(searchWidgetContainer, h2Element.nextSibling);
        searchWidget.container = searchWidgetContainer;
        searchWidget.container.style = "border-radius: 25px;";
      });
      // if you want to add back to the html container
      // comment the line below back out and delete or commment out the homebutton view
      const homebutton = new Home({
        view: view,
        index: 1,
      });

      view.ui.add(homebutton, {
        position: "top-left",
      });

      view.ui.add(basemapExpand, {
        position: "top-right",
      });

      view.ui.add("topbar", "top-right");

      // configuration for distance measurement widgets
      let activeWidget1 = null;

      document
        .getElementById("distanceButton")
        .addEventListener("click", function () {
          setActiveWidget(null);
          if (!this.classList.contains("active")) {
            setActiveWidget("distance");
          } else {
            setActiveButton(null);
          }
        });

      document
        .getElementById("areaButton")
        .addEventListener("click", function () {
          setActiveWidget(null);
          if (!this.classList.contains("active")) {
            setActiveWidget("area");
          } else {
            setActiveButton(null);
          }
        });

      function setActiveWidget(type) {
        switch (type) {
          case "distance":
            activeWidget1 = new DistanceMeasurement2D({
              view: view,
            });

            // skip the initial 'new measurement' button
            activeWidget1.viewModel.start();

            view.ui.add(activeWidget1, "top-right");
            setActiveButton(document.getElementById("distanceButton"));
            break;
          case "area":
            activeWidget1 = new AreaMeasurement2D({
              view: view,
            });

            // skip the initial 'new measurement' button
            activeWidget1.viewModel.start();

            view.ui.add(activeWidget1, "top-right");
            setActiveButton(document.getElementById("areaButton"));
            break;
          case null:
            if (activeWidget1) {
              view.ui.remove(activeWidget1);
              activeWidget1.destroy();
              activeWidget1 = null;
            }
            break;
        }
      }

      function setActiveButton(selectedButton) {
        // focus the view to activate keyboard shortcuts for sketching
        view.focus();
        let elements = document.getElementsByClassName("active");
        for (let i = 0; i < elements.length; i++) {
          elements[i].classList.remove("active");
        }
        if (selectedButton) {
          selectedButton.classList.add("active");
        }
      }

      document.addEventListener("DOMContentLoaded", () => {
        const comboboxItems = document.querySelectorAll(
          "calcite-combobox-item"
        );

        comboboxItems.forEach((item) => {
          item.addEventListener("calciteComboboxItemChange", (event) => {
            console.log("Selected item:", event.target.textLabel);
            // Add your custom logic for handling the selected item here
          });
        });
      });

      view.when(function () {
        webmap.load().then(function () {
          // Wait for all layers to be loaded
          const layersLoaded = webmap.layers.map((layer) => layer.load());
          //   console.log(layersLoaded);
          Promise.all(layersLoaded).then(() => {
            const featureLayerSources = webmap.layers
              .filter(function (layer) {
                // console.log(layer);
                console.log(layer.title);
                return layer.title === "Parcel Boundaries";
              })
              .map(function (featureLayer) {
                const searchFields = ["Uniqueid", "Owner", "Location"];
                // console.log(featureLayer.fields);
                return {
                  layer: featureLayer,
                  searchFields: searchFields,
                  displayField: "Location",
                  outFields: ["*"],
                  name: featureLayer.title,
                  placeholder: "Search " + searchFields,
                  maxSuggestions: 6,
                  searchAllEnabled: true,
                  maxResults: 300,
                  exactMatch: false,
                };
              });

            searchWidget.sources = featureLayerSources;
          });
        });
      });

      webmap.when(() => {
        const { title, description, thumbnailUrl, avgRating } =
          webmap.portalItem;
        document.querySelector("#header-title").textContent = title;
        // document.querySelector("#item-description").innerHTML = description;
        // document.querySelector("#item-thumbnail").src = thumbnailUrl;
        // document.querySelector("#item-rating").value = avgRating;
        const headerTitle = document.getElementById("header-title");

        const camaViewer = document.createElement("h6");
        camaViewer.setAttribute("id", "cama-viewer");
        camaViewer.innerHTML = "CAMA Viewer";
        camaViewer.style = "flex-direction: column;";
        camaViewer.style = "justify-content: center;";
        headerTitle.insertBefore(camaViewer, searchWidgetContainer.firstChild);

        const img = document.createElement("img");
        // img.src =
        //   "https://publicweb-gis.s3.amazonaws.com/Images/MunicipalSeals/North_Haven.png";
        img.alt = "QDS Logo";
        img.width = "50";
        img.height = "50";

        const h2 = headerTitle.querySelector("h2");
        headerTitle.insertBefore(img, h2);

        let activeWidget;

        const handleActionBarClick = ({ target }) => {
          if (target.tagName !== "CALCITE-ACTION") {
            return;
          }

          if (activeWidget) {
            document.querySelector(
              `[data-action-id=${activeWidget}]`
            ).active = false;
            document.querySelector(
              `[data-panel-id=${activeWidget}]`
            ).hidden = true;
          }

          const nextWidget = target.dataset.actionId;
          if (nextWidget !== activeWidget) {
            document.querySelector(
              `[data-action-id=${nextWidget}]`
            ).active = true;
            document.querySelector(
              `[data-panel-id=${nextWidget}]`
            ).hidden = false;
            activeWidget = nextWidget;
          } else {
            activeWidget = null;
          }
        };

        document
          .querySelector("calcite-action-bar")
          .addEventListener("click", handleActionBarClick);

        let actionBarExpanded = false;

        document.addEventListener("calciteActionBarToggle", (event) => {
          actionBarExpanded = !actionBarExpanded;
          view.padding = {
            left: actionBarExpanded ? 160 : 45,
          };
        });
        document.querySelector("calcite-shell").hidden = false;
        document.querySelector("calcite-loader").hidden = true;

        function addLayerToMap(config) {
          const {
            url,
            title,
            fieldName,
            isVisible,
            orderByField,
            combobox1,
            combobox2,
          } = config;

          const featureLayer = new FeatureLayer({
            url,
            title,
            popupEnabled: true,
            visible: isVisible,
          });

          webmap.add(featureLayer);

          const combobox1ID = document.querySelector(`#${combobox1}`);
          const combobox2ID = document.querySelector(`#${combobox2}`);

          view.whenLayerView(featureLayer).then(function (layerView) {
            const uniqueValueQuery = featureLayer.createQuery();
            uniqueValueQuery.returnDistinctValues = true;
            uniqueValueQuery.outFields = [fieldName];
            uniqueValueQuery.orderByFields = [orderByField];

            const applyFilters = () => {
              const selectedItem1 = combobox1ID.selectedItems[0];
              const selectedValue1 = selectedItem1 ? selectedItem1.value : null;
              const selectedItem2 = combobox2ID.selectedItems[0];
              const selectedValue2 = selectedItem2 ? selectedItem2.value : null;

              let filterExpression = "";

              if (selectedValue1 && selectedValue1 !== "Show_All") {
                filterExpression = `${fieldName} = '${selectedValue1}'`;
              }

              if (selectedValue2 && selectedValue2 !== "Show_All") {
                if (filterExpression) {
                  filterExpression += ` OR ${fieldName} = '${selectedValue2}'`;
                } else {
                  filterExpression = `${fieldName} = '${selectedValue2}'`;
                }
              }

              featureLayer.definitionExpression = filterExpression;
            };

            featureLayer.queryFeatures(uniqueValueQuery).then((results) => {
              const uniquePrimaryUses = new Set();
              results.features.forEach((feature) => {
                const primaryUseValue = feature.attributes[fieldName];
                if (
                  !uniquePrimaryUses.has(primaryUseValue) &&
                  primaryUseValue != null
                ) {
                  uniquePrimaryUses.add(primaryUseValue);

                  const item1 = document.createElement("calcite-combobox-item");
                  item1.value = primaryUseValue;
                  item1.textLabel = primaryUseValue;
                  combobox1ID.appendChild(item1);

                  const item2 = document.createElement("calcite-combobox-item");
                  item2.value = primaryUseValue;
                  item2.textLabel = primaryUseValue;
                  combobox2ID.appendChild(item2);
                }
              });
            });

            const showAllItem1 = document.createElement(
              "calcite-combobox-item"
            );
            showAllItem1.value = "Show_All";
            showAllItem1.textLabel = "Show All";
            combobox1ID.appendChild(showAllItem1);

            const showAllItem2 = document.createElement(
              "calcite-combobox-item"
            );
            showAllItem2.value = "Show_All";
            showAllItem2.textLabel = "Show All";
            combobox2ID.appendChild(showAllItem2);

            combobox1ID.addEventListener("calciteComboboxChange", applyFilters);
            combobox2ID.addEventListener("calciteComboboxChange", applyFilters);

            document
              .getElementById("resetFilters")
              .addEventListener("click", () => {
                combobox1ID.selectedItems = [];
                combobox2ID.selectedItems = [];
                applyFilters();
              });
          });
        }
        layers.forEach((layerConfig) => {
          addLayerToMap(layerConfig);
        });

        // Call your function with the specific parameters for each layer

        // addLayerToMap(
        //   "https://services1.arcgis.com/j6iFLXhyiD3XTMyD/ArcGIS/rest/services/CT_North_Haven_CAMA_Viewer/FeatureServer/8",
        //   "Land Influence",
        //   "Influence_Type",
        //   document.querySelector("#combo11"),
        //   document.querySelector("#combo12"),
        //   false,
        //   "OBJECTID_12"
        // );
        // addLayerToMap(
        //   "https://services1.arcgis.com/j6iFLXhyiD3XTMyD/ArcGIS/rest/services/CT_North_Haven_CAMA_Viewer/FeatureServer/4",
        //   "Neighborhood",
        //   "Neighborhood",
        //   document.querySelector("#combo9"),
        //   document.querySelector("#combo10"),
        //   false,
        //   "OBJECTID_1"
        // );
        // addLayerToMap(
        //   "https://services1.arcgis.com/j6iFLXhyiD3XTMyD/ArcGIS/rest/services/CT_North_Haven_CAMA_Viewer/FeatureServer/3",
        //   "Design Type",
        //   "Design_Type",
        //   document.querySelector("#combo7"),
        //   document.querySelector("#combo8"),
        //   false,
        //   "OBJECTID_1"
        // );

        // addLayerToMap(
        //   "https://services1.arcgis.com/j6iFLXhyiD3XTMyD/ArcGIS/rest/services/CT_North_Haven_CAMA_Viewer/FeatureServer/2",
        //   "Parcel Type",
        //   "Parcel_Type",
        //   document.querySelector("#combo5"),
        //   document.querySelector("#combo6"),
        //   false,
        //   "OBJECTID_1"
        // );

        // addLayerToMap(
        //   "https://services1.arcgis.com/j6iFLXhyiD3XTMyD/ArcGIS/rest/services/CT_North_Haven_CAMA_Viewer/FeatureServer/1",
        //   "Primary Building Use",
        //   "Building_Use_Code",
        //   document.querySelector("#combo3"),
        //   document.querySelector("#combo4"),
        //   false,
        //   "OBJECTID_1"
        // );

        // addLayerToMap(
        //   "https://services1.arcgis.com/j6iFLXhyiD3XTMyD/ArcGIS/rest/services/CT_North_Haven_CAMA_Viewer/FeatureServer/0",
        //   "Primary Use",
        //   "Parcel_Primary_Use",
        //   document.querySelector("#combo1"),
        //   document.querySelector("#combo2"),
        //   true,
        //   "OBJECTID_1"
        // );

        // const parcelFeatureLayer = new FeatureLayer({
        //   url: "https://services1.arcgis.com/j6iFLXhyiD3XTMyD/ArcGIS/rest/services/CT_North_Haven_CAMA_Viewer/FeatureServer/0",
        //   title: "Primary Use",
        //   popupEnabled: true,
        // });

        // webmap.add(parcelFeatureLayer);

        // view.whenLayerView(parcelFeatureLayer).then(function (layerView) {
        //   const uniqueValueQuery = parcelFeatureLayer.createQuery();
        //   uniqueValueQuery.returnDistinctValues = true;
        //   uniqueValueQuery.outFields = ["Parcel_Primary_Use"]; // Replace with the actual field name
        //   uniqueValueQuery.orderByFields = ["OBJECTID_1"];

        //   const combobox1 = document.querySelector("#combo1");
        //   const combobox2 = document.querySelector("#combo2");

        //   const applyFilters = () => {
        //     const selectedItem1 = combobox1.selectedItems[0];
        //     const selectedValue1 = selectedItem1 ? selectedItem1.value : null;
        //     const selectedItem2 = combobox2.selectedItems[0];
        //     const selectedValue2 = selectedItem2 ? selectedItem2.value : null;

        //     let filterExpression = "";

        //     if (selectedValue1 && selectedValue1 !== "Show_All") {
        //       filterExpression = `Parcel_Primary_Use = '${selectedValue1}'`;
        //     }

        //     if (selectedValue2 && selectedValue2 !== "Show_All") {
        //       if (filterExpression) {
        //         filterExpression += ` OR Parcel_Primary_Use = '${selectedValue2}'`;
        //       } else {
        //         filterExpression = `Parcel_Primary_Use = '${selectedValue2}'`;
        //       }
        //     }

        //     parcelFeatureLayer.definitionExpression = filterExpression;
        //   };

        //   parcelFeatureLayer.queryFeatures(uniqueValueQuery).then((results) => {
        //     // Use a Set to store unique Parcel_Primary_Use values
        //     const uniquePrimaryUses = new Set();

        //     // Populate the combobox items with the unique values
        //     results.features.forEach((feature) => {
        //       const primaryUseValue = feature.attributes.Parcel_Primary_Use; // Replace with the actual field name
        //       if (
        //         !uniquePrimaryUses.has(primaryUseValue) &&
        //         primaryUseValue != null
        //       ) {
        //         uniquePrimaryUses.add(primaryUseValue);

        //         // Add items to both comboboxes
        //         const item1 = document.createElement("calcite-combobox-item");
        //         item1.value = primaryUseValue;
        //         item1.textLabel = primaryUseValue;
        //         combobox1.appendChild(item1);

        //         const item2 = document.createElement("calcite-combobox-item");
        //         item2.value = primaryUseValue;
        //         item2.textLabel = primaryUseValue;
        //         combobox2.appendChild(item2);
        //       }
        //     });
        //   });

        //   // Add "Show All" combobox item to both comboboxes
        //   const showAllItem1 = document.createElement("calcite-combobox-item");
        //   showAllItem1.value = "Show_All";
        //   showAllItem1.textLabel = "Show All";
        //   combobox1.appendChild(showAllItem1);

        //   const showAllItem2 = document.createElement("calcite-combobox-item");
        //   showAllItem2.value = "Show_All";
        //   showAllItem2.textLabel = "Show All";
        //   combobox2.appendChild(showAllItem2);

        //   // Event listener for the first combobox
        //   combobox1.addEventListener("calciteComboboxChange", applyFilters);

        //   // Event listener for the second combobox
        //   combobox2.addEventListener("calciteComboboxChange", applyFilters);

        //   document.getElementById("resetFilters").addEventListener("click", () => {
        //     filtersEnabled = false;
        //     combobox1.selectedItems = [];
        //     combobox2.selectedItems = [];
        //     applyFilters();
        //   });
        // });

        // // Create a new instance of the parcel feature layer using the URL
        // const primaryBuildLayer = new FeatureLayer({
        //   url: "https://services1.arcgis.com/j6iFLXhyiD3XTMyD/ArcGIS/rest/services/CT_North_Haven_CAMA_Viewer/FeatureServer/1",
        //   title: "Primary Building Use",
        //   visible: false,
        //   popupEnabled: true,
        // });
        // webmap.add(primaryBuildLayer);

        // view.whenLayerView(primaryBuildLayer).then(function (layerView) {
        //   const uniqueValueQuery = primaryBuildLayer.createQuery();
        //   uniqueValueQuery.returnDistinctValues = true;
        //   uniqueValueQuery.outFields = ["Building_Use_Code"]; // Replace with the actual field name
        //   uniqueValueQuery.orderByFields = ["OBJECTID_1"];

        //   const combobox3 = document.querySelector("#combo3");
        //   const combobox4 = document.querySelector("#combo4");

        //   const applyFilters = () => {
        //     const selectedItem1 = combobox3.selectedItems[0];
        //     const selectedValue1 = selectedItem1 ? selectedItem1.value : null;
        //     const selectedItem2 = combobox4.selectedItems[0];
        //     const selectedValue2 = selectedItem2 ? selectedItem2.value : null;

        //     let filterExpression = "";

        //     if (selectedValue1 && selectedValue1 !== "Show_All") {
        //       filterExpression = `Building_Use_Code = '${selectedValue1}'`;
        //     }

        //     if (selectedValue2 && selectedValue2 !== "Show_All") {
        //       if (filterExpression) {
        //         filterExpression += ` OR Building_Use_Code = '${selectedValue2}'`;
        //       } else {
        //         filterExpression = `Building_Use_Code = '${selectedValue2}'`;
        //       }
        //     }

        //     primaryBuildLayer.definitionExpression = filterExpression;
        //   };

        //   primaryBuildLayer.queryFeatures(uniqueValueQuery).then((results) => {
        //     // Use a Set to store unique Parcel_Primary_Use values
        //     const uniquePrimaryUses = new Set();

        //     results.features.forEach((feature) => {
        //       const primaryUseValue = feature.attributes.Building_Use_Code; // Replace with the actual field name
        //       if (
        //         !uniquePrimaryUses.has(primaryUseValue) &&
        //         primaryUseValue != null
        //       ) {
        //         uniquePrimaryUses.add(primaryUseValue);

        //         const item1 = document.createElement("calcite-combobox-item");
        //         item1.value = primaryUseValue;
        //         item1.textLabel = primaryUseValue;
        //         combobox3.appendChild(item1);

        //         const item2 = document.createElement("calcite-combobox-item");
        //         item2.value = primaryUseValue;
        //         item2.textLabel = primaryUseValue;
        //         combobox4.appendChild(item2);
        //       }
        //     });
        //   });

        //   const showAllItem1 = document.createElement("calcite-combobox-item");
        //   showAllItem1.value = "Show_All";
        //   showAllItem1.textLabel = "Show All";
        //   combobox3.appendChild(showAllItem1);

        //   const showAllItem2 = document.createElement("calcite-combobox-item");
        //   showAllItem2.value = "Show_All";
        //   showAllItem2.textLabel = "Show All";
        //   combobox4.appendChild(showAllItem2);

        //   combobox3.addEventListener("calciteComboboxChange", applyFilters);
        //   combobox4.addEventListener("calciteComboboxChange", applyFilters);

        //   document.getElementById("resetFilters").addEventListener("click", () => {
        //     filtersEnabled = false;
        //     combobox3.selectedItems = [];
        //     combobox4.selectedItems = [];
        //     applyFilters();
        //   });
        // });

        // // Create a new instance of the parcel feature layer using the URL
        // const parcelTypeLayer = new FeatureLayer({
        //   url: "https://services1.arcgis.com/j6iFLXhyiD3XTMyD/ArcGIS/rest/services/CT_North_Haven_CAMA_Viewer/FeatureServer/2",
        //   title: "Parcel Type",
        //   visible: false,
        //   popupEnabled: true,
        // });
        // webmap.add(parcelTypeLayer);

        // view.whenLayerView(parcelTypeLayer).then(function (layerView) {
        //   const uniqueValueQuery = parcelTypeLayer.createQuery();
        //   uniqueValueQuery.returnDistinctValues = true;
        //   uniqueValueQuery.outFields = ["Parcel_Type"]; // Replace with the actual field name
        //   uniqueValueQuery.orderByFields = ["OBJECTID_1"];

        //   const combobox5 = document.querySelector("#combo5");
        //   const combobox6 = document.querySelector("#combo6");

        //   const applyFilters = () => {
        //     const selectedItem1 = combobox5.selectedItems[0];
        //     const selectedValue1 = selectedItem1 ? selectedItem1.value : null;
        //     const selectedItem2 = combobox6.selectedItems[0];
        //     const selectedValue2 = selectedItem2 ? selectedItem2.value : null;

        //     let filterExpression = "";

        //     if (selectedValue1 && selectedValue1 !== "Show_All") {
        //       filterExpression = `Parcel_Type = '${selectedValue1}'`;
        //     }

        //     if (selectedValue2 && selectedValue2 !== "Show_All") {
        //       if (filterExpression) {
        //         filterExpression += ` OR Parcel_Type = '${selectedValue2}'`;
        //       } else {
        //         filterExpression = `Parcel_Type = '${selectedValue2}'`;
        //       }
        //     }

        //     parcelTypeLayer.definitionExpression = filterExpression;
        //   };

        //   parcelTypeLayer.queryFeatures(uniqueValueQuery).then((results) => {
        //     // Use a Set to store unique Parcel_Primary_Use values
        //     const uniquePrimaryUses = new Set();

        //     // Populate the combobox items with the unique values
        //     results.features.forEach((feature) => {
        //       const primaryUseValue = feature.attributes.Parcel_Type; // Replace with the actual field name
        //       if (
        //         !uniquePrimaryUses.has(primaryUseValue) &&
        //         primaryUseValue != null
        //       ) {
        //         uniquePrimaryUses.add(primaryUseValue);

        //         // Add items to both comboboxes
        //         const item1 = document.createElement("calcite-combobox-item");
        //         item1.value = primaryUseValue;
        //         item1.textLabel = primaryUseValue;
        //         combobox5.appendChild(item1);

        //         const item2 = document.createElement("calcite-combobox-item");
        //         item2.value = primaryUseValue;
        //         item2.textLabel = primaryUseValue;
        //         combobox6.appendChild(item2);
        //       }
        //     });
        //   });

        //   const showAllItem1 = document.createElement("calcite-combobox-item");
        //   showAllItem1.value = "Show_All";
        //   showAllItem1.textLabel = "Show All";
        //   combobox5.appendChild(showAllItem1);

        //   const showAllItem2 = document.createElement("calcite-combobox-item");
        //   showAllItem2.value = "Show_All";
        //   showAllItem2.textLabel = "Show All";
        //   combobox6.appendChild(showAllItem2);

        //   combobox5.addEventListener("calciteComboboxChange", applyFilters);
        //   combobox6.addEventListener("calciteComboboxChange", applyFilters);

        //   document.getElementById("resetFilters").addEventListener("click", () => {
        //     filtersEnabled = false;
        //     combobox5.selectedItems = [];
        //     combobox6.selectedItems = [];
        //     applyFilters();
        //   });
        // });

        // // Create a new instance of the parcel feature layer using the URL
        // const designTypeLayer = new FeatureLayer({
        //   url: "https://services1.arcgis.com/j6iFLXhyiD3XTMyD/ArcGIS/rest/services/CT_North_Haven_CAMA_Viewer/FeatureServer/3",
        //   title: "Design Type",
        //   visible: false,
        //   popupEnabled: true,
        // });
        // webmap.add(designTypeLayer);

        // view.whenLayerView(designTypeLayer).then(function (layerView) {
        //   const uniqueValueQuery = designTypeLayer.createQuery();
        //   uniqueValueQuery.returnDistinctValues = true;
        //   uniqueValueQuery.outFields = ["Design_Type"]; // Replace with the actual field name
        //   uniqueValueQuery.orderByFields = ["OBJECTID_1"];

        //   const combobox7 = document.querySelector("#combo7");
        //   const combobox8 = document.querySelector("#combo8");

        //   const applyFilters = () => {
        //     const selectedItem1 = combobox7.selectedItems[0];
        //     const selectedValue1 = selectedItem1 ? selectedItem1.value : null;
        //     const selectedItem2 = combobox8.selectedItems[0];
        //     const selectedValue2 = selectedItem2 ? selectedItem2.value : null;

        //     let filterExpression = "";

        //     if (selectedValue1 && selectedValue1 !== "Show_All") {
        //       filterExpression = `Design_Type = '${selectedValue1}'`;
        //     }

        //     if (selectedValue2 && selectedValue2 !== "Show_All") {
        //       if (filterExpression) {
        //         filterExpression += ` OR Design_Type = '${selectedValue2}'`;
        //       } else {
        //         filterExpression = `Design_Type = '${selectedValue2}'`;
        //       }
        //     }

        //     designTypeLayer.definitionExpression = filterExpression;
        //   };

        //   designTypeLayer.queryFeatures(uniqueValueQuery).then((results) => {
        //     const uniquePrimaryUses = new Set();
        //     results.features.forEach((feature) => {
        //       const primaryUseValue = feature.attributes.Design_Type; // Replace with the actual field name
        //       if (
        //         !uniquePrimaryUses.has(primaryUseValue) &&
        //         primaryUseValue != null
        //       ) {
        //         uniquePrimaryUses.add(primaryUseValue);

        //         const item1 = document.createElement("calcite-combobox-item");
        //         item1.value = primaryUseValue;
        //         item1.textLabel = primaryUseValue;
        //         combobox7.appendChild(item1);

        //         const item2 = document.createElement("calcite-combobox-item");
        //         item2.value = primaryUseValue;
        //         item2.textLabel = primaryUseValue;
        //         combobox8.appendChild(item2);
        //       }
        //     });
        //   });

        //   const showAllItem1 = document.createElement("calcite-combobox-item");
        //   showAllItem1.value = "Show_All";
        //   showAllItem1.textLabel = "Show All";
        //   combobox7.appendChild(showAllItem1);

        //   const showAllItem2 = document.createElement("calcite-combobox-item");
        //   showAllItem2.value = "Show_All";
        //   showAllItem2.textLabel = "Show All";
        //   combobox8.appendChild(showAllItem2);

        //   combobox7.addEventListener("calciteComboboxChange", applyFilters);
        //   combobox8.addEventListener("calciteComboboxChange", applyFilters);

        //   document.getElementById("resetFilters").addEventListener("click", () => {
        //     filtersEnabled = false;
        //     combobox7.selectedItems = [];
        //     combobox8.selectedItems = [];
        //     applyFilters();
        //   });
        // });

        // // Create a new instance of the parcel feature layer using the URL
        // const neighborhoodLayer = new FeatureLayer({
        //   url: "https://services1.arcgis.com/j6iFLXhyiD3XTMyD/ArcGIS/rest/services/CT_North_Haven_CAMA_Viewer/FeatureServer/4",
        //   title: "Neighborhood",
        //   visible: false,
        //   popupEnabled: true,
        // });
        // webmap.add(neighborhoodLayer);

        // view.whenLayerView(neighborhoodLayer).then(function (layerView) {
        //   const uniqueValueQuery = neighborhoodLayer.createQuery();
        //   uniqueValueQuery.returnDistinctValues = true;
        //   uniqueValueQuery.outFields = ["Neighborhood"]; // Replace with the actual field name
        //   uniqueValueQuery.orderByFields = ["OBJECTID_1"];

        //   const combobox9 = document.querySelector("#combo9");
        //   const combobox10 = document.querySelector("#combo10");

        //   const applyFilters = () => {
        //     const selectedItem1 = combobox9.selectedItems[0];
        //     const selectedValue1 = selectedItem1 ? selectedItem1.value : null;
        //     const selectedItem2 = combobox10.selectedItems[0];
        //     const selectedValue2 = selectedItem2 ? selectedItem2.value : null;

        //     let filterExpression = "";

        //     if (selectedValue1 && selectedValue1 !== "Show_All") {
        //       filterExpression = `Neighborhood = '${selectedValue1}'`;
        //     }

        //     if (selectedValue2 && selectedValue2 !== "Show_All") {
        //       if (filterExpression) {
        //         filterExpression += ` OR Neighborhood = '${selectedValue2}'`;
        //       } else {
        //         filterExpression = `Neighborhood = '${selectedValue2}'`;
        //       }
        //     }

        //     neighborhoodLayer.definitionExpression = filterExpression;
        //   };

        //   neighborhoodLayer.queryFeatures(uniqueValueQuery).then((results) => {
        //     // Use a Set to store unique Parcel_Primary_Use values
        //     const uniquePrimaryUses = new Set();

        //     // Populate the combobox items with the unique values
        //     results.features.forEach((feature) => {
        //       const primaryUseValue = feature.attributes.Neighborhood; // Replace with the actual field name
        //       if (
        //         !uniquePrimaryUses.has(primaryUseValue) &&
        //         primaryUseValue != null
        //       ) {
        //         uniquePrimaryUses.add(primaryUseValue);
        //         const item1 = document.createElement("calcite-combobox-item");
        //         item1.value = primaryUseValue;
        //         item1.textLabel = primaryUseValue;
        //         combobox9.appendChild(item1);

        //         const item2 = document.createElement("calcite-combobox-item");
        //         item2.value = primaryUseValue;
        //         item2.textLabel = primaryUseValue;
        //         combobox10.appendChild(item2);
        //       }
        //     });
        //   });

        //   const showAllItem1 = document.createElement("calcite-combobox-item");
        //   showAllItem1.value = "Show_All";
        //   showAllItem1.textLabel = "Show All";
        //   combobox9.appendChild(showAllItem1);

        //   const showAllItem2 = document.createElement("calcite-combobox-item");
        //   showAllItem2.value = "Show_All";
        //   showAllItem2.textLabel = "Show All";
        //   combobox10.appendChild(showAllItem2);

        //   combobox9.addEventListener("calciteComboboxChange", applyFilters);
        //   combobox10.addEventListener("calciteComboboxChange", applyFilters);

        //   document.getElementById("resetFilters").addEventListener("click", () => {
        //     filtersEnabled = false;
        //     combobox9.selectedItems = [];
        //     combobox10.selectedItems = [];
        //     applyFilters();
        //   });
        // });

        // // Create a new instance of the parcel feature layer using the URL
        // const influenceLayer = new FeatureLayer({
        //   url: "https://services1.arcgis.com/j6iFLXhyiD3XTMyD/ArcGIS/rest/services/CT_North_Haven_CAMA_Viewer/FeatureServer/8",
        //   title: "Land Influence",
        //   visible: false,
        //   popupEnabled: true,
        // });
        // webmap.add(influenceLayer);

        // view.whenLayerView(influenceLayer).then(function (layerView) {
        //   const uniqueValueQuery = influenceLayer.createQuery();
        //   uniqueValueQuery.returnDistinctValues = true;
        //   uniqueValueQuery.outFields = ["Influence_Type"]; // Replace with the actual field name
        //   uniqueValueQuery.orderByFields = ["OBJECTID_12"];

        //   const combobox11 = document.querySelector("#combo11");
        //   const combobox12 = document.querySelector("#combo12");

        //   const applyFilters = () => {
        //     const selectedItem1 = combobox11.selectedItems[0];
        //     const selectedValue1 = selectedItem1 ? selectedItem1.value : null;
        //     const selectedItem2 = combobox12.selectedItems[0];
        //     const selectedValue2 = selectedItem2 ? selectedItem2.value : null;

        //     let filterExpression = "";

        //     if (selectedValue1 && selectedValue1 !== "Show_All") {
        //       filterExpression = `Influence_Type = '${selectedValue1}'`;
        //     }

        //     if (selectedValue2 && selectedValue2 !== "Show_All") {
        //       if (filterExpression) {
        //         filterExpression += ` OR Influence_Type = '${selectedValue2}'`;
        //       } else {
        //         filterExpression = `Influence_Type = '${selectedValue2}'`;
        //       }
        //     }

        //     influenceLayer.definitionExpression = filterExpression;
        //   };

        //   influenceLayer.queryFeatures(uniqueValueQuery).then((results) => {
        //     const uniquePrimaryUses = new Set();
        //     results.features.forEach((feature) => {
        //       const primaryUseValue = feature.attributes.Influence_Type; // Replace with the actual field name
        //       if (
        //         !uniquePrimaryUses.has(primaryUseValue) &&
        //         primaryUseValue != null
        //       ) {
        //         uniquePrimaryUses.add(primaryUseValue);

        //         const item1 = document.createElement("calcite-combobox-item");
        //         item1.value = primaryUseValue;
        //         item1.textLabel = primaryUseValue;
        //         combobox11.appendChild(item1);

        //         const item2 = document.createElement("calcite-combobox-item");
        //         item2.value = primaryUseValue;
        //         item2.textLabel = primaryUseValue;
        //         combobox12.appendChild(item2);
        //       }
        //     });
        //   });

        //   const showAllItem1 = document.createElement("calcite-combobox-item");
        //   showAllItem1.value = "Show_All";
        //   showAllItem1.textLabel = "Show All";
        //   combobox11.appendChild(showAllItem1);

        //   const showAllItem2 = document.createElement("calcite-combobox-item");
        //   showAllItem2.value = "Show_All";
        //   showAllItem2.textLabel = "Show All";
        //   combobox12.appendChild(showAllItem2);

        //   combobox11.addEventListener("calciteComboboxChange", applyFilters);
        //   combobox12.addEventListener("calciteComboboxChange", applyFilters);

        //   document.getElementById("resetFilters").addEventListener("click", () => {
        //     filtersEnabled = false;
        //     combobox11.selectedItems = [];
        //     combobox12.selectedItems = [];
        //     applyFilters();
        //   });
        // });
      });
    });
});
