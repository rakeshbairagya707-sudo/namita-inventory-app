(function () {
  "use strict";

  const CONFIG = window.NAMITA_CONFIG || {};
  let client = null;

  if (
    window.supabase &&
    CONFIG.SUPABASE_URL &&
    CONFIG.SUPABASE_ANON_KEY &&
    CONFIG.SUPABASE_ANON_KEY !== "YOUR_SUPABASE_ANON_KEY"
  ) {
    try {
      client = window.supabase.createClient(
        CONFIG.SUPABASE_URL,
        CONFIG.SUPABASE_ANON_KEY,
        {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true
          }
        }
      );
    } catch (error) {
      console.error("Supabase initialization error:", error);
    }
  }

  const NamitaCore = {

    config: CONFIG,

    supabase: client,

    isSupabaseReady() {
      return !!client;
    },

    async healthCheck() {
      if (!client) {
        return {
          ok: false,
          message: "Supabase configuration missing."
        };
      }

      try {
        const { error } = await client
          .from("business_settings")
          .select("id")
          .limit(1);

        if (error) throw error;

        return {
          ok: true,
          message: "Supabase connection successful."
        };

      } catch (error) {

        return {
          ok: false,
          message: error.message || "Supabase connection failed."
        };
      }
    },

    async get(table, options = {}) {

      if (!client) {
        throw new Error("Supabase is not configured.");
      }

      let query = client
        .from(table)
        .select(options.select || "*");

      if (options.eq) {
        Object.entries(options.eq).forEach(([key, value]) => {
          query = query.eq(key, value);
        });
      }

      if (options.neq) {
        Object.entries(options.neq).forEach(([key, value]) => {
          query = query.neq(key, value);
        });
      }

      if (options.order) {
        query = query.order(
          options.order.column,
          {
            ascending: options.order.ascending !== false
          }
        );
      }

      if (Number.isInteger(options.limit)) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data || [];
    },

    async insert(table, payload) {

      if (!client) {
        throw new Error("Supabase is not configured.");
      }

      const { data, error } = await client
        .from(table)
        .insert(payload)
        .select()
        .single();

      if (error) throw error;

      return data;
    },

    async update(table, payload, filters = {}) {

      if (!client) {
        throw new Error("Supabase is not configured.");
      }

      let query = client
        .from(table)
        .update(payload);

      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });

      const { data, error } = await query
        .select()
        .single();

      if (error) throw error;

      return data;
    },

    async remove(table, filters = {}) {

      if (!client) {
        throw new Error("Supabase is not configured.");
      }

      let query = client
        .from(table)
        .delete();

      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });

      const { error } = await query;

      if (error) throw error;

      return true;
    },

    async currentUser() {

      if (!client) return null;

      const { data } = await client.auth.getUser();

      return data?.user || null;
    },

    async signOut() {

      if (!client) return;

      const { error } = await client.auth.signOut();

      if (error) throw error;
    },

    money(value) {

      const number = Number(value || 0);

      return `${CONFIG.CURRENCY || "₹"}${number.toLocaleString(
        CONFIG.LOCALE || "en-IN",
        {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }
      )}`;
    },

    uuid() {

      if (crypto.randomUUID) {
        return crypto.randomUUID();
      }

      return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
        /[xy]/g,
        function (c) {

          const r = Math.random() * 16 | 0;

          const v =
            c === "x"
              ? r
              : (r & 0x3 | 0x8);

          return v.toString(16);
        }
      );
    }

  };

  window.NamitaCore = NamitaCore;

})();
