from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.views.static import serve
from store.admin import crm_admin_site # ✅ Importação do CRM customizado

urlpatterns = [
    path('admin/', admin.site.urls),
    path('crm-dashboard/', crm_admin_site.urls), # ✅ Reativa a Dashboard do CRM
    path('', include('store.urls')),
]

# 🔥 CORREÇÃO PARA MÍDIA E STATIC (Essencial para Fly.io/Produção)
# Garante que o Django sirva os arquivos mesmo com DEBUG=False
urlpatterns += [
    re_path(r'^media/(?P<path>.*)$', serve, {'document_root': settings.MEDIA_ROOT}),
    re_path(r'^static/(?P<path>.*)$', serve, {'document_root': settings.STATIC_ROOT}),
]