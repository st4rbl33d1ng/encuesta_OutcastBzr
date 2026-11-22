# Outcast Bazar · Encuesta

Encuesta responsiva en español. No solicita nombre, correo ni teléfono. Cada envío recibe un código de seguimiento; las respuestas se alojan en Supabase y solo las cuentas autorizadas pueden buscarlas desde el panel privado. `config.js` ya está conectado al proyecto Supabase de Outcast Bazar usando su clave pública.

## Preparar el almacenamiento privado

El proyecto de Outcast Bazar ya tiene las tablas y las políticas necesarias instaladas. Para instalar esta encuesta en otro proyecto:

1. Crea un proyecto en [Supabase](https://supabase.com/).
2. Abre **SQL Editor**, pega el contenido de `supabase.sql` y ejecútalo.
3. En **Authentication → Users**, crea una cuenta para cada administrador. Desactiva el registro público de usuarios en la configuración de Authentication.
4. Copia el UUID de cada administrador y ejecútalo en SQL Editor como `insert into public.survey_admins (user_id) values ('UUID-DEL-USUARIO-ADMIN');`.
5. En **Project Settings → API Keys**, copia la URL del proyecto y su clave **Publishable** a `config.js`.

La clave `anon` es pública por diseño. Las políticas de seguridad de la base de datos impiden que los visitantes lean respuestas; la clave `service_role` nunca debe ir en los archivos del sitio.

## Publicar en GitHub Pages

1. En el repositorio abre **Settings → Pages**.
2. En **Build and deployment**, selecciona **Deploy from a branch**, elige `main` y la carpeta `/ (root)`, y guarda.
3. GitHub mostrará la dirección pública del sitio al terminar la publicación. Para este repositorio, será `https://st4rbl33d1ng.github.io/encuensta/`.

No requiere compilación. La clave Publishable está diseñada para estar en una página pública; nunca agregues la clave `secret` o `service_role` al repositorio.

## Privacidad y códigos

- No se recopilan identificadores personales ni WhatsApp; por eso la encuesta no necesita presentarse como un registro con contacto.
- Las respuestas completas solo son consultables mediante una cuenta autenticada que también esté en `survey_admins`.
- El código de seguimiento se muestra al responder. Pide a la persona que lo guarde; no se asocia a su identidad.
- No hay búsqueda pública por código. Si se desea que los propios encuestados recuperen su respuesta, habría que añadir un mecanismo separado que no revele respuestas de terceros.

## Archivos

- `index.html`: encuesta, panel de acceso y consulta.
- `styles.css`: diseño adaptable a móvil.
- `app.js`: validación, envío, códigos y búsqueda de administrador.
- `config.js`: URL y clave pública de Supabase.
- `supabase.sql`: tablas y políticas de acceso.
