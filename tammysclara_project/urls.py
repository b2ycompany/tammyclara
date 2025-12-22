from django.contrib import admin
from django.urls import path, include, re_path # Adicionado re_path
from django.conf import settings
from django.conf.urls.static import static
from django.views.static import serve # Adicionado serve para produção
from store.admin import crm_admin_site

urlpatterns = [
    path('admin/', admin.site.urls),
    path('crm-dashboard/', crm_admin_site.urls),
    path('', include('store.urls')),
]

# 🔥 CORREÇÃO DEFINITIVA PARA IMAGENS NO FLY.IO
# Isso força o Django a entregar as fotos mesmo com DEBUG=False
urlpatterns += [
    re_path(r'^media/(?P<path>.*)$', serve, {'document_root': settings.MEDIA_ROOT}),
    re_path(r'^static/(?P<path>.*)$', serve, {'document_root': settings.STATIC_ROOT}),
]