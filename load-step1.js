(function () {
  "use strict";

  window.NamitaStep1 = {

    loaded: true,

    supabaseReady:
      !!(
        window.NamitaCore &&
        window.NamitaCore.isSupabaseReady()
      )

  };

  console.log(
    "NAMITA STORE Core Loaded",
    window.NamitaStep1
  );

})();
