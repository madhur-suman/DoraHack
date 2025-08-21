from django.conf import settings


class DisableCSRFMiddleware:

	def __init__(self, get_response):
		self.get_response = get_response

	def __call__(self, request):
		# In development, disable CSRF for API endpoints to simplify local auth flows
		if settings.DEBUG and request.path.startswith('/api/'):
			setattr(request, '_dont_enforce_csrf_checks', True)
		return self.get_response(request)


