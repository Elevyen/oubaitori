import { useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import '../styles/terminos.css';

export default function TermsPage() {
    const navigate = useNavigate();

    return (
        <main className="terms-page" aria-labelledby="terms-title">
            <Card className="terms-card">
                <header className="terms-card-header">
                    <h1 id="terms-title">Términos y Política de Privacidad</h1>
                </header>
                <div
                    className="terms-content"
                    role="region"
                    aria-label="Contenido legal y política de privacidad"
                >
                    <section className="tfg-disclaimer-section">
                        <h2>Aviso Legal Importante (Proyecto Académico)</h2>

                        <p>
                            <strong>
                                Oubaitori es actualmente un proyecto desarrollado en el marco de
                                un Trabajo de Fin de Grado (TFG) de CFGS en Desarrollo de Aplicaciones Web para el centro FOC.
                            </strong>{' '}
                            La plataforma se encuentra en evolución constante y se ofrece sin
                            fines comerciales, con el objetivo de explorar el
                            bienestar emocional y la organización de
                            registros emocionales de forma privada.
                        </p>
                        <p>
                            Aunque se aplican medidas técnicas orientadas a proteger la
                            información almacenada, incluyendo procesos de cifrado de datos
                            sensibles, ningún sistema puede garantizar seguridad absoluta,
                            disponibilidad permanente o ausencia total de errores.
                        </p>
                        <p>
                            El uso de la plataforma implica la aceptación de estos términos y
                            el entendimiento de que ciertas funcionalidades pueden cambiar,
                            actualizarse o interrumpirse durante el desarrollo del proyecto.
                        </p>
                    </section>
                    <section>
                        <h2>1. Objeto del servicio</h2>
                        <p>
                            <strong>Oubaitori</strong> es una aplicación orientada al registro
                            emocional y la escritura reflexiva. Permite guardar emociones,
                            notas personales, estados de ánimo, fechas y otros elementos
                            relacionados con el seguimiento emocional del usuario.
                        </p>
                        <p>
                            El objetivo de la plataforma es ofrecer un espacio personal,
                            privado y tranquilo para fomentar la autoexpresión, la reflexión y
                            el crecimiento emocional a través de diarios y registros
                            personales.
                        </p>
                    </section>
                    <section>
                        <h2>2. Definiciones</h2>
                        <p>
                            <strong>Usuario:</strong> persona que crea una cuenta o utiliza la
                            plataforma.
                        </p>
                        <p>
                            <strong>Registro emocional:</strong> contenido creado por el
                            usuario que puede incluir emociones, texto libre, reflexiones,
                            etiquetas, fechas u otra información personal.
                        </p>
                        <p>
                            <strong>Datos sensibles:</strong> información personal que pueda
                            revelar aspectos emocionales, psicológicos o íntimos del usuario.
                        </p>
                        <p>
                            <strong>Servicio:</strong> aplicación web, interfaz, API,
                            almacenamiento y funcionalidades ofrecidas por Oubaitori.
                        </p>
                    </section>
                    <section>
                        <h2>3. Acceso y cuentas</h2>
                        <p>
                            Para utilizar determinadas funcionalidades es necesario crear una
                            cuenta. El usuario es responsable de mantener la confidencialidad
                            de sus credenciales y de cualquier actividad realizada desde su
                            cuenta.
                        </p>
                        <p>
                            Las contraseñas no se almacenan en texto plano y son tratadas
                            mediante mecanismos de protección adecuados.
                        </p>
                        <p>
                            Queda prohibido:
                        </p>
                        <ul>
                            <li>Suplantar la identidad de otras personas.</li>
                            <li>Automatizar la creación masiva de cuentas.</li>
                            <li>Intentar vulnerar la seguridad del sistema.</li>
                            <li>Utilizar la plataforma con fines ilícitos o abusivos.</li>
                        </ul>
                        <p>
                            Oubaitori podrá limitar o suspender cuentas que comprometan la
                            estabilidad, seguridad o funcionamiento del servicio.
                        </p>
                    </section>
                    <section>
                        <h2>4. Privacidad y tratamiento de datos</h2>
                        <p>
                            La privacidad emocional del usuario es uno de los pilares
                            principales de Oubaitori.
                        </p>
                        <p>
                            Los registros personales pueden contener información especialmente
                            sensible relacionada con emociones, experiencias personales o salud
                            emocional. Por ello, la aplicación incorpora medidas orientadas a
                            proteger dicha información mediante procesos de cifrado y control
                            de acceso.
                        </p>
                        <p>
                            El contenido almacenado pertenece exclusivamente al usuario.
                            Oubaitori no vende, comparte ni utiliza los registros personales
                            con fines publicitarios o comerciales.
                        </p>
                        <p>
                            Los datos podrán utilizarse únicamente para:
                        </p>
                        <ul>
                            <li>Permitir el funcionamiento técnico de la aplicación.</li>
                            <li>Mejorar la estabilidad y experiencia de uso.</li>
                            <li>
                                Resolver errores, incidencias técnicas o problemas de seguridad.
                            </li>
                            <li>
                                Elaborar métricas anónimas relacionadas con el uso general del
                                sistema.
                            </li>
                        </ul>
                        <p>
                            En ningún caso se realiza una lectura manual deliberada de los
                            diarios personales salvo obligación legal o necesidad técnica
                            excepcional derivada de una incidencia crítica comunicada por el
                            propio usuario.
                        </p>
                        <p>
                            El usuario puede solicitar la eliminación permanente de su cuenta y
                            de los datos asociados, salvo aquellos que deban conservarse por
                            obligación legal o motivos estrictamente técnicos.
                        </p>
                    </section>
                    <section>
                        <h2>5. Seguridad de la información</h2>
                        <p>
                            Oubaitori aplica medidas razonables de seguridad para proteger los
                            datos almacenados frente a accesos no autorizados, alteraciones,
                            pérdidas accidentales o divulgación indebida.
                        </p>
                        <p>
                            Parte de la información sensible almacenada en los registros
                            emocionales puede ser cifrada antes de persistirse en la base de
                            datos, reduciendo la exposición directa del contenido.
                        </p>
                        <p>
                            Aun así, el usuario entiende y acepta que ningún sistema digital es
                            completamente infalible y que pueden existir riesgos derivados de
                            fallos técnicos, vulnerabilidades de terceros, errores humanos o
                            incidentes externos.
                        </p>
                        <p>
                            Se recomienda no utilizar la plataforma para almacenar:
                        </p>
                        <ul>
                            <li>Contraseñas.</li>
                            <li>Datos bancarios.</li>
                            <li>Documentos oficiales.</li>
                            <li>Información médica extremadamente sensible.</li>
                            <li>
                                Cualquier otro dato cuya exposición pudiera generar un riesgo
                                crítico para el usuario.
                            </li>
                        </ul>
                    </section>
                    <section>
                        <h2>6. Uso responsable y bienestar emocional</h2>
                        <p>
                            Oubaitori es una herramienta de apoyo personal y organización
                            emocional, pero no sustituye atención médica, psicológica o
                            psiquiátrica profesional.
                        </p>
                        <p>
                            Si el usuario atraviesa una situación de crisis emocional,
                            ansiedad severa, riesgo de autolesión o cualquier circunstancia que
                            requiera atención urgente, se recomienda acudir a profesionales
                            especializados o servicios de emergencia correspondientes.
                        </p>
                    </section>
                    <section>
                        <h2>7. Disponibilidad del servicio</h2>
                        <p>
                            Debido a la naturaleza académica y experimental del proyecto,
                            Oubaitori no garantiza disponibilidad ininterrumpida ni ausencia de
                            errores.
                        </p>
                        <p>
                            El servicio puede experimentar:
                        </p>
                        <ul>
                            <li>Mantenimientos temporales.</li>
                            <li>Actualizaciones técnicas.</li>
                            <li>Cambios en funcionalidades.</li>
                            <li>Interrupciones inesperadas.</li>
                        </ul>
                        <p>
                            Se recomienda conservar copias externas de los textos o recuerdos
                            que el usuario considere especialmente importantes.
                        </p>
                    </section>
                    <section>
                        <h2>8. Limitación de responsabilidad</h2>
                        <p>
                            En la máxima medida permitida por la legislación aplicable,
                            Oubaitori y su desarrollador no serán responsables de:
                        </p>
                        <ul>
                            <li>Pérdida accidental de información.</li>
                            <li>Interrupciones del servicio.</li>
                            <li>Daños indirectos derivados del uso de la aplicación.</li>
                            <li>Accesos no autorizados causados por terceros externos.</li>
                            <li>Decisiones personales tomadas por el usuario.</li>
                        </ul>
                        <p>
                            El usuario utiliza la plataforma bajo su propia responsabilidad y
                            entendiendo las limitaciones propias de un proyecto académico en
                            desarrollo.
                        </p>
                    </section>
                    <section>
                        <h2>9. Propiedad intelectual</h2>
                        <p>
                            El código fuente, diseño visual, identidad gráfica, logotipo,
                            estructura y nombre de <strong>Oubaitori</strong> pertenecen a su
                            desarrollador, salvo que se indique lo contrario.
                        </p>
                        <p>
                            El contenido personal generado por el usuario sigue siendo
                            propiedad exclusiva del propio usuario.
                        </p>
                    </section>
                    <section>
                        <h2>10. Modificaciones de los términos</h2>
                        <p>
                            Estos términos podrán actualizarse para reflejar cambios técnicos,
                            legales o funcionales del proyecto.
                        </p>
                        <p>
                            La fecha de última actualización se mostrará al final del
                            documento. El uso continuado de la aplicación tras dichas
                            modificaciones implicará la aceptación de los nuevos términos.
                        </p>
                    </section>

                    <section>
                        <h2>11. Contacto y soporte</h2>

                        <p>
                            Si tienes dudas relacionadas con privacidad, seguridad,
                            funcionamiento del proyecto o eliminación de datos, puedes
                            contactar a través de:
                        </p>

                        <p>
                            <strong>
                                <button
                                    type="button"
                                    className="mailto-link contact-link-button"
                                    onClick={() => navigate('/contacto')}
                                >
                                    Ir a contacto
                                </button>
                            </strong>
                        </p>
                    </section>
                </div>

                <footer className="terms-footer">
                    <div className="terms-footer-meta">
                        <small>Última actualización: 10 de mayo de 2026</small>
                    </div>

                    <div className="terms-footer-actions">
                        <button
                            type="button"
                            className="btn-back"
                            onClick={() => navigate('/')}
                            aria-label="Aceptar y volver al inicio"
                        >Aceptar</button>
                    </div>
                </footer>
            </Card>
        </main>
    );
}