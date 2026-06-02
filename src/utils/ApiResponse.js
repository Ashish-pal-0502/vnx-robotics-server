class ApiResponse {
   /**
    * Create a standardized API response
    * @param {Object} options
    * @param {number} options.statusCode - HTTP status code
    * @param {*} options.data - Response data (object will be flattened, arrays go to .data)
    * @param {string} options.message - Response message
    * @param {*} options.errors - Error details
    * @param {boolean} options.includeTimestamp - Include ISO timestamp (default: true)
    */
   constructor({
      statusCode = 200,
      data = null,
      message = "Success",
      errors = null,
      includeTimestamp = true,
   } = {}) {
      // Reserved properties that cannot be overwritten by data
      const reservedKeys = [
         "statusCode",
         "success",
         "message",
         "errors",
         "timestamp",
      ];

      this.statusCode = statusCode;
      this.success = statusCode >= 200 && statusCode < 400;
      this.message = message;

      if (includeTimestamp) {
         this.timestamp = new Date().toISOString();
      }

      // Handle data flattening
      if (data !== null && typeof data === "object" && !Array.isArray(data)) {
         // Filter out reserved keys to prevent overwriting
         const safeData = { ...data };
         reservedKeys.forEach((key) => delete safeData[key]);

         // Only assign if there are properties left
         if (Object.keys(safeData).length > 0) {
            Object.assign(this, safeData);
         }
      } else if (data !== null) {
         // Arrays and primitives go to data property
         this.data = data;
      }

      // Add errors if present
      if (errors) {
         this.errors = errors;
      }
   }

   /**
    * Create a success response
    * @param {Object} options
    * @returns {ApiResponse}
    */
   static success({
      data,
      message = "Success",
      statusCode = 200,
      includeTimestamp = true,
   } = {}) {
      return new ApiResponse({ statusCode, data, message, includeTimestamp });
   }

   /**
    * Create an error response
    * @param {Object} options
    * @returns {ApiResponse}
    */
   static error({
      message = "Error",
      statusCode = 500,
      errors = null,
      includeTimestamp = true,
   } = {}) {
      return new ApiResponse({ statusCode, message, errors, includeTimestamp });
   }
}

export { ApiResponse };
