//Laddar upp filer med hjälp av filepond plug in. CSS som hjälper bestämma bildens storlek på olika dela av sidan

const rootStyles = window.getComputedStyle(document.documentElement);

if (
  rootStyles.getPropertyValue("--recipe-cover-width-large") != null &&
  rootStyles.getPropertyValue("--recipe-cover-width-large") !== ""
) {
  ready();
} else {
  document.getElementById("style-css").addEventListener("load", ready);
}

function ready() {
  const coverWidth = parseFloat(
    rootStyles.getPropertyValue("--recipe-cover-width-large")
  );
  const coverAspectRatio = parseFloat(
    rootStyles.getPropertyValue("--recipe-cover-aspect-ratio")
  );
  const coverHeight = coverWidth / coverAspectRatio;
  FilePond.registerPlugin(
    FilePondPluginImagePreview,
    FilePondPluginImageResize,
    FilePondPluginFileEncode
  );

  FilePond.setOptions({
    stylePanelAspectRatio: 1 / coverAspectRatio,
    imageResizeTargetWidth: coverWidth,
    imageResizeTargetHeight: coverHeight,
  });

  FilePond.parse(document.body);
}
