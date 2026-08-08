/**
 * uploadFileStore
 *
 * A simple module-level store for the File object selected on the Upload page.
 *
 * WHY THIS EXISTS:
 * React Router's location.state is JSON-serialised during navigation.
 * Browser File objects are not JSON-serialisable — they lose their binary
 * data and arrive as null on the receiving page.
 *
 * Storing the File reference here (outside React's render cycle) keeps it
 * alive across the /upload → /processing navigation without any serialisation.
 *
 * Usage:
 *   // On UploadDataset page (before navigating):
 *   uploadFileStore.set(file);
 *   navigate('/processing');
 *
 *   // On Processing page (after mount):
 *   const file = uploadFileStore.get();
 *   uploadFileStore.clear();   // clear after reading
 */
const uploadFileStore = (() => {
  let _file = null;

  return {
    set:   (file) => { _file = file; },
    get:   ()     => _file,
    clear: ()     => { _file = null; },
  };
})();

export default uploadFileStore;
