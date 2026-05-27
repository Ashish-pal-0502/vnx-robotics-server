class ApiResponse {
   constructor({
      statusCode = 200,
      data = null,
      message = "Success",
      errors = null,
   } = {}) {
      this.statusCode = statusCode;
      this.success = statusCode < 400;
      this.message = message;

      if (data !== null) this.data = data;
      if (errors) this.errors = errors;
   }

   static success({ data, message = "Success", statusCode = 200 } = {}) {
      return new ApiResponse({ statusCode, data, message });
   }

   static error({ message = "Error", statusCode = 500, errors = null } = {}) {
      return new ApiResponse({ statusCode, message, errors });
   }
}

export { ApiResponse };
